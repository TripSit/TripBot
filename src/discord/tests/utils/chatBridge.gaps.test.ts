import { ChannelType, Collection, MessageType } from 'discord.js';
import type { Message } from 'discord.js';
import type { Mock } from 'vitest';

const LOUNGE_ID = 'discord-lounge';
const BOT_ID = 'bot-user';
const originalClient = global.discordClient;
const originalLounge = env.CHANNEL_LOUNGE;

let chatBridge: typeof import('../../utils/chatBridge');
let core: typeof import('../../../global/bridge/bridge');
let webhookSend: Mock;
let ircSend: Mock;

const webhook = () => ({
  id: 'wh', name: 'TripSit Chat Bridge', guildId: 'guild-1', owner: { id: BOT_ID }, send: webhookSend,
});

const message = (over: Record<string, unknown> = {}): Message => ({
  id: 'm1',
  type: MessageType.Default,
  channelId: LOUNGE_ID,
  guildId: 'guild-1',
  content: 'hello',
  cleanContent: 'hello',
  webhookId: null,
  applicationId: null,
  editedTimestamp: null,
  partial: false,
  attachments: new Collection(),
  embeds: [],
  member: { displayName: 'Moony' },
  author: {
    bot: false, username: 'moonbear', displayName: 'Moonbear', displayAvatarURL: () => 'https://cdn/a.png',
  },
  client: { user: { id: BOT_ID } },
  inGuild: () => true,
  ...over,
} as unknown as Message);

const install = (guilds: Collection<string, unknown>) => {
  webhookSend = vi.fn().mockResolvedValue(undefined);
  global.discordClient = {
    user: { id: BOT_ID },
    isReady: () => true,
    channels: {
      fetch: vi.fn().mockResolvedValue({
        type: ChannelType.GuildText, fetchWebhooks: vi.fn().mockResolvedValue(new Collection()), createWebhook: vi.fn().mockResolvedValue(webhook()),
      }),
    },
    guilds: { cache: guilds },
  } as unknown as typeof global.discordClient;
};

beforeEach(async () => {
  vi.resetModules();
  env.CHANNEL_LOUNGE = LOUNGE_ID;
  chatBridge = await import('../../utils/chatBridge');
  core = await import('../../../global/bridge/bridge');
  ircSend = vi.fn().mockResolvedValue(undefined);
  core.registerBridgeTarget({ platform: 'irc', send: ircSend });
  vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
  vi.spyOn(global.log, 'debug').mockReturnValue(undefined as never);
});

afterEach(() => {
  global.discordClient = originalClient;
  env.CHANNEL_LOUNGE = originalLounge;
  vi.restoreAllMocks();
});

describe('avatar lookup edge cases', () => {
  const outgoing = (nick: string) => ({
    gateway: 'Lounge', sourcePlatform: 'irc' as const, nick, text: 'hi', action: false,
  });

  it('sends without an avatar when the webhook guild is not cached', async () => {
    install(new Collection());
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing('Someone'));
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ avatarURL: undefined }));
  });

  it('keeps the avatar cache bounded', async () => {
    const guild = { id: 'guild-1', members: { cache: new Collection(), search: vi.fn().mockResolvedValue(new Collection()) } };
    install(new Collection([['guild-1', guild]]));
    for (let i = 0; i < 505; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing(`nick${i}`));
    }
    expect(guild.members.search).toHaveBeenCalledTimes(505);
    // the oldest entries were evicted, so the first nick is searched for again
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing('nick0'));
    expect(guild.members.search).toHaveBeenCalledTimes(506);
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing('nick504'));
    expect(guild.members.search).toHaveBeenCalledTimes(506);
  });
});

describe('registerDiscordBridge', () => {
  it('registers the Discord target so other platforms reach the channel', async () => {
    install(new Collection());
    chatBridge.registerDiscordBridge();
    await core.relayMessage({
      platform: 'irc', channel: '#lounge', nick: 'IrcUser', text: 'hello discord',
    });
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ content: 'hello discord' }));
  });
});

describe('relay failures', () => {
  it('logs instead of throwing when an edit cannot be fetched', async () => {
    install(new Collection());
    const partial = message({
      partial: true, editedTimestamp: 2, content: 'x', fetch: vi.fn().mockRejectedValue(new Error('Unknown Message')),
    });
    await expect(chatBridge.relayDiscordEdit(message({ editedTimestamp: null, content: 'y' }), partial)).resolves.toBeUndefined();
    expect(global.log.error).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('Failed to relay Discord edit'));
  });

  it('ignores deletions of messages the bridge itself posted, and logs relay errors', async () => {
    install(new Collection());
    const remove = vi.fn().mockResolvedValue(undefined);
    core.registerBridgeTarget({ platform: 'irc', send: ircSend, remove });
    // sending once makes the bridge remember its webhook
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, {
      gateway: 'Lounge', sourcePlatform: 'irc', nick: 'N', text: 'hi', action: false,
    });
    await chatBridge.relayDiscordDelete(message({ webhookId: 'wh' }));
    expect(remove).not.toHaveBeenCalled();

    const exploding = message();
    Object.defineProperty(exploding, 'channelId', { get() { throw new Error('boom'); } });
    await expect(chatBridge.relayDiscordDelete(exploding)).resolves.toBeUndefined();
    expect(global.log.error).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('Failed to relay Discord delete'));
  });
});
