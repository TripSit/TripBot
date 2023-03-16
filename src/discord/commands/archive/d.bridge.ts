import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { bridgeWording } from '../../../global/commands/archive/g.bridge';
// import log from '../../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

export const bridge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('Information on the bridge!'),
  async execute(interaction) {
    // log.debug(F, `starting!`);
    const response = await bridgeWording();
    await interaction.reply(stripIndents`${response}`);
    return true;
  },
};
