import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {joke} from '../../../global/commands/g.joke';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dJoke: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Random jokes'),

  async execute(interaction) {
    const data = await joke();

    const embed = embedTemplate();
    if (data.type === 'twopart') embed.setTitle(data.setup).setDescription(data.delivery);
    else embed.setTitle(data.joke);

    interaction.reply({embeds: [embed], ephemeral: false});
    return true;
  },
};
