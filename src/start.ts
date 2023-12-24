/* eslint-disable @typescript-eslint/no-unused-vars */
import { getVoiceConnection } from '@discordjs/voice';
// import { stripIndents } from 'common-tags';
import sourceMap from 'source-map-support'; // eslint-disable-line
import {
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import * as path from 'path';
import Canvas from '@napi-rs/canvas';
import { env } from './global/utils/env.config';
import { log } from './global/utils/log';
import validateEnv from './global/utils/env.validate'; // eslint-disable-line
import commandContext from './discord/utils/context'; // eslint-disable-line
import discordConnect from './discord/discord';
import api from './api/api'; // eslint-disable-line
import updateDb from './global/utils/updateDb';
// import startMatrix from './matrix/matrix';
// import ircConnect from './irc/irc';
// import telegramConnect from './telegram/telegram';

sourceMap.install();

global.bootTime = new Date();

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, './global/assets/font/Futura.otf'),
  'futura',
);

const F = f(__filename);

// const net = require('net');
// work around a node v20 bug: https://github.com/nodejs/node/issues/47822#issuecomment-1564708870
// if (net.setDefaultAutoSelectFamily) {
//   net.setDefaultAutoSelectFamily(false);
// }

async function start() {
  log.info(F, 'Initializing service!');
  if (validateEnv('SERVICES')) {
    api();
    await updateDb();
    if (env.DISCORD_CLIENT_TOKEN && await validateEnv('DISCORD')) await discordConnect();
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
  var commandContext:(
    interaction: ChatInputCommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ModalSubmitInteraction,
  ) => Promise<string>;
}

global.env = env;
global.commandContext = commandContext;
