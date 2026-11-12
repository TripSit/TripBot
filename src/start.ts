import { log } from './global/utils/log'; // eslint-disable-line
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getVoiceConnection } from '@discordjs/voice';
import 'module-alias/register';
// import { stripIndents } from 'common-tags';
import Canvas from '@napi-rs/canvas';
import {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import * as path from 'path';
import sourceMap from 'source-map-support'; // eslint-disable-line
import api from './api/api'; // eslint-disable-line
import discordConnect from './discord/discord';
import deployCommands from './discord/utils/commandDeploy';
import commandContext from './discord/utils/context'; // eslint-disable-line
import { env } from './global/utils/env.config';
import validateEnv from './global/utils/env.validate'; // eslint-disable-line
import updateDb from './global/utils/updateDb';
import db from './prisma/tripbot/client';
import ircConnect, { ircDisconnect } from './irc/irc';
import startHeartbeat from './global/utils/heartbeat';
// import startMatrix from './matrix/matrix';
// import telegramConnect from './telegram/telegram';

sourceMap.install();

global.bootTime = new Date();

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../assets/font/Futura.otf'),
  'futura',
);

const F = f(__filename);

// Discord REST uses its own undici agent (connect timeout, DNS cache, address-family settings): see
// src/discord/utils/restNetwork.ts. The old net.setDefaultAutoSelectFamily(false) workaround was removed because
// the agent sets autoSelectFamily explicitly for those requests.

async function start() {
  log.info(F, 'Initializing service!');
  if (validateEnv('SERVICES')) {
    api();
    global.db = db;
    await updateDb();
    if (env.DISCORD_CLIENT_TOKEN && validateEnv('DISCORD')) {
      await discordConnect();
      // Register slash commands on every start; a failure must not stop the bot
      await deployCommands({ skipIfUnchanged: true, exitOnError: false });
    }
    // if (env.MATRIX_ACCESS_TOKEN && validateEnv( 'MATRIX') && env.NODE_ENV !== 'production') await startMatrix();
    if (env.IRC_PASSWORD && validateEnv('IRC')) {
      // A failed IRC start must not take down the Discord bot
      await ircConnect().catch(err => log.error(F, `Failed to start IRC: ${err}`));
    }
    // if (env.TELEGRAM_TOKEN && validateEnv('TELEGRAM')) await telegramConnect();
    startHeartbeat();
  }
}

start();

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
  ircDisconnect();
  process.exit(0);
};
process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  // var env:any; // NOSONAR
  // eslint-disable-next-line no-var, vars-on-top
  var commandContext:(
    interaction: ChatInputCommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | ModalSubmitInteraction,
  ) => Promise<string>;
}

global.env = env;
global.commandContext = commandContext;
