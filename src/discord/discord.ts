import {
  GatewayIntentBits,
} from 'discord-api-types/v10';
import {
  Client,
  Partials,
} from 'discord.js';
import { registerCommands } from './commands';
import { registerEvents } from './events';
import { registerTentStatusSync } from './utils/tents';
import { isQueuedTicketRename } from './utils/ticketIcons';

const F = f(__filename);

export default async function discordConnect(): Promise<void> {
  const discordClient = new Client({
    intents: [
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildEmojisAndStickers,
      // GatewayIntentBits.GuildIntegrations,
      // GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      // GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      // GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.DirectMessages,
      // GatewayIntentBits.DirectMessageReactions,
      // GatewayIntentBits.DirectMessageTyping,
      // GatewayIntentBits.GuildScheduledEvents,
    ],
    partials: [
      Partials.User,
      Partials.Channel,
      Partials.GuildMember,
      Partials.Message,
      Partials.Reaction,
      // Partials.GuildScheduledEvent,
    ],
    allowedMentions: {
      parse: ['users', 'roles'],
      repliedUser: true,
    },
    rest: {
      rejectOnRateLimit: rateLimitData => {
        if (rateLimitData.sublimitTimeout <= 0) {
          return false;
        }

        const { method, route, majorParameter } = rateLimitData;
        const seconds = Math.ceil(rateLimitData.sublimitTimeout / 1000);
        const reject = isQueuedTicketRename(majorParameter);
        const outcome = reject ? 'retrying' : 'held';
        log.info(F, `${method.toUpperCase()} ${route} (${majorParameter}) hit a sublimit, ${outcome} in ${seconds}s`);
        return reject;
      },
    },
  });

  global.discordClient = discordClient;

  registerTentStatusSync(discordClient);

  Promise.all([registerCommands(discordClient), registerEvents(discordClient)])
    .then(() => discordClient.login(env.DISCORD_CLIENT_TOKEN))
    .then(() => log.info(F, `${discordClient.user?.username} logged in!`));
}
