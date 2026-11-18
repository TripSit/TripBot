import { Message, MessageFlags } from 'discord.js';
import {
  isCodeAgentConfigured, parseCodeAgentRequest, runCodeAgent,
} from '../../global/commands/g.codeAgent';

const F = f(__filename);

/**
 * Developers only: the owner anywhere, or ROLE_DEVELOPER members inside the development category of the main guild.
 * Anyone else is ignored (not even refused) so the feature is invisible to them.
 */
export function canUseCodeAgent(message: Message): boolean {
  if (message.author.bot) return false;
  if (message.author.id === env.DISCORD_OWNER_ID) return true;
  if (message.guild?.id !== env.DISCORD_GUILD_ID) return false;
  if (!message.member?.roles?.cache?.has(env.ROLE_DEVELOPER)) return false;
  const channel = message.channel as { parentId?: string | null; parent?: { parentId?: string | null } | null };
  const category = channel.parentId ?? null;
  const threadCategory = channel.parent?.parentId ?? null;
  return category === env.CATEGORY_DEVELOPMENT || threadCategory === env.CATEGORY_DEVELOPMENT;
}

/** Handles "@tripbot there's an issue with X, fix it". Returns true when the message was taken by the agent. */
export async function handleCodeAgentRequest(message: Message): Promise<boolean> {
  if (!canUseCodeAgent(message)) return false;

  const request = parseCodeAgentRequest(message.cleanContent);
  if (!request) return false;

  if (!isCodeAgentConfigured()) {
    await message.reply({
      content: 'The code agent is not configured (needs `CLAUDE_CODE_OAUTH_TOKEN` and `GITHUB_TOKEN`).',
      allowedMentions: { parse: [] },
      flags: MessageFlags.SuppressEmbeds,
    });
    return true;
  }

  log.info(F, `Code agent request from ${message.author.id} in ${message.channelId}`);
  const status = await message.reply({
    content: 'On it. I will investigate in a scratch checkout and open a PR if I find a fix. This can take a while.',
    allowedMentions: { parse: [] },
  });

  const result = await runCodeAgent(request);
  let content: string;
  if (result.status === 'pr') content = `Opened a PR: ${result.url}`;
  else if (result.status === 'report') content = `I did not change anything. What I found:\n${result.summary}`.slice(0, 1900);
  else content = `I could not finish that: ${result.message}`;

  await status.edit({ content, allowedMentions: { parse: [] }, flags: MessageFlags.SuppressEmbeds });
  return true;
}

/** True when this message is a developer's fix request, which belongs to the code agent and not to AI chat. */
export function isCodeAgentRequest(message: Message): boolean {
  return canUseCodeAgent(message) && parseCodeAgentRequest(message.cleanContent) !== null;
}
