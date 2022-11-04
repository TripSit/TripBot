import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {stripIndents} from 'common-tags';
import {bridgeWording} from '../../../global/commands/archive/g.bridge';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const bridge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('Information on the bridge!'),
  async execute(interaction) {
    // logger.debug(`[${PREFIX}] starting!`);
    const response = await bridgeWording();
    interaction.reply(stripIndents`${response}`);
    // logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
