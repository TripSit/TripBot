import {
  Client,
  Partials,
} from 'discord.js';
import {
  GatewayIntentBits,
} from 'discord-api-types/v10';
import env from '../global/utils/env.config';
import log from '../global/utils/log';
import {registerCommands} from './commands';
import {registerEvents} from './events';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

// eslint-disable-next-line
// https://discord.com/api/oauth2/authorize?client_id=977945272359452713&permissions=378225575936&scope=bot%20applications.commands
/**
 * Starts the discord bot
 * eslint disable-next-line
 */
export async function discordConnect(): Promise<void> {
  const client = new Client({
    intents: [
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildEmojisAndStickers,
      // GatewayIntentBits.GuildIntegrations,
      // GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildPresences,
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

  global.client = client;

  Promise.all([registerCommands(client), registerEvents(client)])
    .then(() => client.login(env.DISCORD_CLIENT_TOKEN))
    .then(() => log.info(`[${PREFIX}] ${client.user?.username} logged in!`));
}
