import { MessageFlags, SlashCommandBuilder, time } from 'discord.js';
import lastDose from '../../../global/commands/g.lastdose';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);
const units = {
  MG: 'mg',
  ML: 'mL',
  MICRO_G: 'µg',
  G: 'g',
  OZ: 'oz',
  FLOZ: 'fl oz',
};

export const dLastdose: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lastdose')
    .setDescription('Show your most recent saved /idose record')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addBooleanOption(option => option
      .setName('ephemeral')
      .setDescription('Set to False to show the response to everyone')) as SlashCommandBuilder,
  async execute(interaction) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
    await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
    try {
      const dose = await lastDose(interaction.user.id);
      if (!dose) {
        await interaction.editReply({ content: 'You have no saved dose records. Use /idose set to add one.' });
        return false;
      }
      const route = dose.route.charAt(0) + dose.route.slice(1).toLowerCase();
      const embed = embedTemplate()
        .setTitle('Your last saved dose')
        .addFields(
          { name: 'Recorded dose', value: `${dose.amount} ${units[dose.units]} of ${dose.substance} (${route})` },
          { name: 'Taken', value: `${time(dose.takenAt, 'F')} (${time(dose.takenAt, 'R')})` },
        );
      await interaction.editReply({ embeds: [embed], allowedMentions: { parse: [] } });
      return true;
    } catch {
      log.error(F, 'Could not retrieve the latest saved dose');
      await interaction.editReply({ content: 'I could not retrieve your last dose. Please try again later.' });
      return false;
    }
  },
};

export default dLastdose;
