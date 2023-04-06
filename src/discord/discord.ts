import {
  Client,
  Partials,
} from 'discord.js';
import {
  GatewayIntentBits,
} from 'discord-api-types/v10';
import { registerCommands } from './commands';
import { registerEvents } from './events';

const F = f(__filename);

export default discordConnect;

// eslint-disable-next-line
// https://discord.com/api/oauth2/authorize?client_id=977945272359452713&permissions=378225575936&scope=bot%20applications.commands
/**
 * Starts the discord bot
 * eslint disable-next-line
 */
export async function discordConnect(): Promise<void> {
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
  });

  global.discordClient = discordClient;
  global.client = discordClient;

  Promise.all([registerCommands(discordClient), registerEvents(discordClient)])
    .then(() => discordClient.login(env.DISCORD_CLIENT_TOKEN))
    .then(() => log.info(F, `${discordClient.user?.username} logged in!`));
}
