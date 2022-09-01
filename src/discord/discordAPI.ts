import {
  Client,
  Partials,
} from 'discord.js';
import {
  GatewayIntentBits,
} from 'discord-api-types/v10';
import env from '../global/utils/env.config';
import logger from '../global/utils/logger';
import {registerCommands} from './commands';
import {registerEvents} from './events';
const PREFIX = require('path').parse(__filename).name;

/**
 * Starts the discord bot
 */
export async function discordConnect(): Promise<void> {
  logger.debug(`[${PREFIX}] Starting discord bot!`);
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

  global.client = client;

  Promise.all([registerCommands(client), registerEvents(client)])
      .then(() => client.login(env.DISCORD_CLIENT_TOKEN))
      .then(() => logger.debug(`[${PREFIX}] ${client.user?.username} logged in!`));
}
