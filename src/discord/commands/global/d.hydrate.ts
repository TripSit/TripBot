import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {startLog} from '../../utils/startLog';
// import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const dhydrate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hydrate')
    .setDescription('Remember to hydrate!'),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const output = '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊\n\n' +
        '⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️\n\n' +
        '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊';
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setDescription(output)
      .setAuthor(null)
      .setFooter(null);

    interaction.reply({embeds: [embed], ephemeral: false});
    return true;
  },
};