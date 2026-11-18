import { Guild } from 'discord.js';
import { appeal_status, Prisma } from '@db/tripbot';

export class StaffAppealError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const reviewFields = {
  id: true,
  appeal_number: true,
  reason: true,
  solution: true,
  future: true,
  extra: true,
  status: true,
  created_at: true,
  reminded_at: true,
  decided_at: true,
  response_message: true,
  users: { select: { discord_id: true, username: true } },
} satisfies Prisma.appealsSelect;

export async function listStaffAppeals(guildId: string, status: appeal_status, page: number) {
  const rows = await db.appeals.findMany({
    where: { guild_id: guildId, status },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    skip: page * 25,
    take: 26,
    select: reviewFields,
  });
  return {
    appeals: rows.slice(0, 25).map(({ users, ...appeal }) => ({ ...appeal, ...users })),
    hasMore: rows.length > 25,
  };
}

export async function decideStaffAppeal(guild: Guild, appealId: string, decision: 'ACCEPTED' | 'DENIED', response: string, actorId: string) {
  return db.$transaction(async tx => {
    // Serialize reviewers, including conditional updates from Discord's existing appeal buttons.
    await tx.$queryRaw`SELECT id FROM appeals WHERE id = ${appealId}::uuid AND guild_id = ${guild.id} FOR UPDATE`;
    const appeal = await tx.appeals.findFirst({
      where: { id: appealId, guild_id: guild.id },
      include: { users: { select: { discord_id: true } } },
    });
    if (!appeal) throw new StaffAppealError(404, 'Appeal not found');
    if (appeal.status !== 'RECEIVED') throw new StaffAppealError(409, 'Appeal was already reviewed');
    const latest = await tx.appeals.findFirst({
      where: { user_id: appeal.user_id, guild_id: guild.id },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });
    if (latest?.id !== appeal.id) throw new StaffAppealError(409, 'A newer appeal exists for this member');
    const discordId = appeal.users.discord_id;
    if (decision === 'ACCEPTED' && !discordId) throw new StaffAppealError(409, 'No linked Discord account');

    const actor = await tx.users.upsert({
      where: { discord_id: actorId }, create: { discord_id: actorId }, update: {},
    });
    await tx.user_actions.create({
      data: {
        user_id: appeal.user_id,
        target_discord_id: discordId,
        guild_id: guild.id,
        type: decision === 'ACCEPTED' ? 'APPEAL_ACCEPT' : 'APPEAL_REJECT',
        created_by: actor.id,
        description: response,
        internal_note: `Website staff review of appeal ${appeal.id}`,
      },
    });
    await tx.appeals.update({
      where: { id: appeal.id },
      data: { status: decision, decided_at: new Date(), response_message: response },
    });
    if (decision === 'ACCEPTED' && discordId) {
      try {
        await guild.bans.remove(discordId, `Appeal ${appeal.id} accepted by ${actorId}`);
      } catch (error) {
        // A previous successful unban followed by a failed DB commit is safe to retry.
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 10026)) {
          throw new StaffAppealError(502, 'Unban failed; the appeal decision was not saved');
        }
      }
    }
    return { success: true };
  }, { timeout: 15000 });
}
