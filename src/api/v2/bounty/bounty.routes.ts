import express from 'express';
import RateLimit from 'express-rate-limit';
import { Guild, GuildMember, TextChannel } from 'discord.js';
import checkAuth from '../../utils/checkAuth';
import { getDiscordUserByGitHub } from '../../../global/utils/keycloak';
import { awardGitHubXP } from '../../../global/utils/experience';

const F = f(__filename);
const router = express.Router();

// Set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// Apply rate limiter to all requests
router.use(limiter);

// A claim reference is "<pull request>#<issue>", so the same bounty can only be paid once
const REFERENCE_PATTERN = /^\d+#\d+$/;

type AwardResult = { status: number; body: Record<string, unknown> };
type AwardRequest = { github_username: string; bounty: number; reference?: string };

/** Returns what is wrong with the request body, or null when it is valid. */
function validateAwardBody(body: Partial<AwardRequest>): string | null {
  const { github_username: githubUsername, bounty, reference } = body;
  if (!githubUsername || !bounty) return 'Missing required fields: github_username or bounty';
  if (!Number.isInteger(bounty) || bounty <= 0 || bounty >= 100000) {
    return 'Bounty amount must be a whole number less than 100000 and greater than 0.';
  }
  if (reference !== undefined && (typeof reference !== 'string' || !REFERENCE_PATTERN.test(reference))) {
    return 'Reference must look like "<pull request number>#<issue number>".';
  }
  return null;
}

/** Records the claim first, then awards the XP; the claim is released again if awarding fails. */
async function claimAndAward(guild: Guild, guildMember: GuildMember, body: AwardRequest): Promise<AwardResult> {
  const { bounty: bountyAmount, reference } = body;
  const claimType = reference ? `GitHub:${reference}` : 'GitHub';
  if (reference && await db.claimed_bounties.findFirst({ where: { type: claimType } })) {
    return { status: 409, body: { error: `Bounty ${reference} was already awarded.` } };
  }
  const claim = await db.claimed_bounties.create({
    data: { type: claimType, amount: bountyAmount, user_id: guildMember.id },
  });

  try {
    const announceChannel = await guild.channels.fetch(env.CHANNEL_DEVELOPMENT) as TextChannel;
    await awardGitHubXP(guildMember, bountyAmount, announceChannel);
  } catch (awardError) {
    await db.claimed_bounties.delete({ where: { id: claim.id } }).catch(() => undefined);
    throw awardError;
  }

  // eslint-disable-next-line max-len
  log.info(F, `Successfully awarded ${bountyAmount} XP to ${guildMember.displayName} (${guildMember.id}) for GitHub contributions`);
  return {
    status: 200,
    body: {
      success: true,
      message: `Awarded ${bountyAmount} XP to ${guildMember.displayName}`,
      discordUserId: guildMember.id,
      bountyAmount,
    },
  };
}

async function awardBounty(body: AwardRequest): Promise<AwardResult> {
  const githubUsername = body.github_username;
  log.debug(F, `Awarding ${body.bounty} XP to GitHub user: ${githubUsername}`);

  // Look up the Discord user via Keycloak using the GitHub username
  const discordUserData = await getDiscordUserByGitHub(githubUsername);
  if (!discordUserData) {
    return { status: 404, body: { error: `No Discord user found linked to GitHub username: ${githubUsername}` } };
  }

  // Fetch the Discord guild and member; an unknown member rejects instead of returning null
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const guildMember = await guild.members.fetch(discordUserData.id).catch(() => null);
  if (!guildMember) {
    return { status: 404, body: { error: `Guild Member with ID ${discordUserData.id} could not be found in TripSit Guild.` } };
  }

  log.debug(F, `Found Discord user ${guildMember.id} for GitHub user ${githubUsername}`);

  // Make sure we aren't awarding to a team member
  if (guildMember.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
    log.error(F, `Cannot award XP to team members: ${guildMember.displayName} (${guildMember.id})`);
    return { status: 403, body: { error: 'Cannot award XP to team members.' } };
  }

  return claimAndAward(guild, guildMember, body);
}

// POST endpoint for GitHub to award bounty XP
router.post('/award-xp', async (req, res, next) => {
  try {
    if (!await checkAuth(req, res)) return next();
    const invalid = validateAwardBody(req.body);
    if (invalid) return res.status(400).json({ error: invalid });
    const result = await awardBounty(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    log.error(F, `Error awarding bounty XP: ${error}`);
    return next(error);
  }
});

export default router;
