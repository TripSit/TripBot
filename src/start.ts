// import { Colors, EmbedBuilder, TextChannel } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
// import { stripIndents } from 'common-tags';
import { env } from './global/utils/env.config';
import { log } from './global/utils/log';
import { discordConnect } from './discord/discord'; // eslint-disable-line
import validateEnv from './global/utils/env.validate'; // eslint-disable-line
import { commandContext } from './discord/utils/context'; // eslint-disable-line
// import startMatrix from './matrix/matrix';

global.bootTime = new Date();

const F = f(__filename);

// const error10062 = 'Error 10062: (Unknown Interaction Error)[https://github.com/discord/discord-api-docs/issues/5558] for details'; // eslint-disable-line max-len

async function start() {
  log.info(F, 'Initializing service!');
  validateEnv('SERVICES');
  if (env.DISCORD_CLIENT_TOKEN && validateEnv('DISCORD')) await discordConnect();
  // if (env.MATRIX_ACCESS_TOKEN && validateEnv('MATRIX') && env.NODE_ENV !== 'production') await startMatrix();
}

start();

process.on('unhandledRejection', async (error: Error) => {
  Error.stackTraceLimit = 50;
  const errorStack = error.stack || JSON.stringify(error, null, 2);

  // Log the error locally
  log.error(F, `${errorStack}`);

  // If this is production, send a message to the channel and alert the developers
  //   if (env.NODE_ENV === 'production') {
  //     sentry.captureException(error);

  //     // Construct the embed
  //     const embed = new EmbedBuilder()
  //       .setColor(Colors.Red)
  //       .setDescription(errorStack);

  //     // Get channel we send errors to
  //     const channel = await client.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;

  //     // If the error is a 10062, we know it's a Discord API error, to kind of ignore it =/
  //     if ((error as any).code === 10062) { // eslint-disable-line @typescript-eslint/no-explicit-any
  //       await channel.send({
  //         embeds: [
  //           embed.setDescription(error10062), // eslint-disable-line max-len
  //         ],
  //       });
  //       return;
  //     }

  //     // Get the role we want to ping
  //     const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
  //     const role = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);

//     // Alert the developers
//     await channel.send({
//       embeds: [
//         embed.setDescription(`**unhandled Error\`\`\`${errorStack}\`\`\`${role} should check this out!`),
//       ],
//     });
//   }
});

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  log.info(F, 'Gracefully stopping the bot (CTRL + C pressed)');
  // try {
  //   if (global.manager) {
  //     global.manager.teardown();
  //   }
  // } catch (err) {
  //   log.error(F, `${err}`);
  // }
  const existingConnection = getVoiceConnection(env.DISCORD_GUILD_ID);
  if (existingConnection) {
    existingConnection.destroy();
  }
  process.exit(0);
};
process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  // var env:any; // NOSONAR
  // eslint-disable-next-line no-var, vars-on-top
  var commandContext:any; // NOSONAR
}

global.env = env;
global.commandContext = commandContext;
