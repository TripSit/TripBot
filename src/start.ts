import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';

import { getVoiceConnection } from '@discordjs/voice';
import Canvas from '@napi-rs/canvas';
import { PrismaClient } from '@prisma/client';
import * as path from 'node:path';
// import { stripIndents } from 'common-tags';
import sourceMap from 'source-map-support';

import api from './api/api';
import discordConnect from './discord/discord';
import commandContext from './discord/utils/context';
import { env as environment } from './global/utils/env.config';
import validateEnvironment from './global/utils/env.validate';
import { log } from './global/utils/log';
import updateDatabase from './global/utils/updateDb';
// import startMatrix from './matrix/matrix';
// import ircConnect from './irc/irc';
// import telegramConnect from './telegram/telegram';

sourceMap.install();

globalThis.bootTime = new Date();

Canvas.GlobalFonts.registerFromPath(path.resolve(__dirname, '../assets/font/Futura.otf'), 'futura');

const F = f(__filename);

// const net = require('net');
// work around a node v20 bug: https://github.com/nodejs/node/issues/47822#issuecomment-1564708870
// if (net.setDefaultAutoSelectFamily) {
//   net.setDefaultAutoSelectFamily(false);
// }

async function start() {
  log.info(F, 'Initializing service!');
  if (validateEnvironment('SERVICES')) {
    api();
    globalThis.db = new PrismaClient({ log: ['error'] });
    await updateDatabase();
    if (environment.DISCORD_CLIENT_TOKEN && validateEnvironment('DISCORD')) {
      await discordConnect();
    }
    // if (env.MATRIX_ACCESS_TOKEN && validateEnv( 'MATRIX') && env.NODE_ENV !== 'production') await startMatrix();
    // if (env.IRC_PASSWORD && validateEnv('IRC') && env.NODE_ENV !== 'production') ircConnect();
    // if (env.TELEGRAM_TOKEN && validateEnv('TELEGRAM')) await telegramConnect();
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
  const existingConnection = getVoiceConnection(environment.DISCORD_GUILD_ID);
  if (existingConnection) {
    existingConnection.destroy();
  }
  process.exit(0);
};
process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);

declare global {
  // var env:any; // NOSONAR

  var commandContext: (
    interaction:
      | ButtonInteraction
      | ChatInputCommandInteraction
      | MessageContextMenuCommandInteraction
      | ModalSubmitInteraction
      | StringSelectMenuInteraction
      | UserContextMenuCommandInteraction,
  ) => Promise<string>;
}

globalThis.env = environment;
globalThis.commandContext = commandContext;
