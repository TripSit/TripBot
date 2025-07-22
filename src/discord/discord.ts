import { GatewayIntentBits } from 'discord-api-types/v10';
import { Client, Partials } from 'discord.js';

import { registerCommands } from './commands';
import { registerEvents } from './events';

const F = f(__filename);

export default async function discordConnect(): Promise<void> {
  const discordClient = new Client({
    allowedMentions: {
      parse: ['users', 'roles'],
      repliedUser: true,
    },
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

  globalThis.discordClient = discordClient;

  Promise.all([registerCommands(discordClient), registerEvents(discordClient)])
    .then(async () => discordClient.login(env.DISCORD_CLIENT_TOKEN))
    .then(() => log.info(F, `${discordClient.user?.username} logged in!`));
}
