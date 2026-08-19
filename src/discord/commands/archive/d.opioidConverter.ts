import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { mainConversion } from '../../../global/utils/opioidConverter';

const F = f(__filename);

export const dOpioidConverter: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('opioid')
    .setDescription('Dosage conversion between two opioids. Note: this does not take changing the ROA into account.')
    .addSubcommand(subcommand => subcommand
      .setName('convert')
      .setDescription('Converts one opioid dosage to another\'s equivalent.')
      .addStringOption(option => option
        .setName('from')
        .setDescription('The opioid to convert from.')
        .setRequired(true))
      .addNumberOption(option => option
        .setName('dosage')
        .setDescription('The dose **in milligrams (mg)** you want to convert.')
        .setRequired(true))
      .addStringOption(option => option
        .setName('to')
        .setDescription('The opioid to convert to.')
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    const dosage = interaction.options.getNumber('dosage', true);
    const opi1: string = interaction.options.getString('from', true);
    const opi2 = interaction.options.getString('to', true);

    const result = mainConversion(dosage, opi1, opi2);

    const embed = embedTemplate()
      .setTitle('Conversion Result')
      .setColor(Colors.Blurple)
      .setDescription(`
        ${dosage}mg ${opi1} ~= **${result}mg ${opi2}**

        Please note that this is not perfect and does not account for ROA changes.
      `);

    await interaction.reply({ embeds: [embed] });
    await interaction.editReply({
      embeds: [embed],
    });

    return true;
  },
};

export default dOpioidConverter;
