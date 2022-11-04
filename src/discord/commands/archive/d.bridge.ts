import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {stripIndents} from 'common-tags';
import {bridgeWording} from '../../../global/commands/archive/g.bridge';
// import log from '../../../global/utils/log';
// import {parse} from 'path';
// const PREFIX = parse(__filename).name;

export const bridge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('Information on the bridge!'),
  async execute(interaction) {
    // log.debug(`[${PREFIX}] starting!`);
    const response = await bridgeWording();
    interaction.reply(stripIndents`${response}`);
    return true;
  },
};
