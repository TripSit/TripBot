import { stripIndents } from 'common-tags';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { crisis } from '../../../global/commands/g.crisis';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dCrisis: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('crisis')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .setDescription('Information that may be helpful in a serious situation.')
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const emsInfo = await crisis();
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const embed = embedTemplate();

    embed.setTitle('Crisis Information');
    // for (const entry of emsInfo) {
    for (const entry of emsInfo) {
      const country = `(${entry.country})`;
      const website = `\n[Website](${entry.website})`;
      const webchat = `\n[Webchat](${entry.webchat})`;
      const phone = `\nCall: ${entry.phone}`;
      const text = `\nText: ${entry.text}`;
      embed.addFields({
        inline: true,
        name: `${entry.name} ${entry.country ? country : ''}`,
        value: stripIndents`${entry.website ? website : ''}\
            ${entry.webchat ? webchat : ''}\
            ${entry.phone ? phone : ''}\
            ${entry.text ? text : ''}`,
      });
    }
    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }
    return true;
  },
};

export default dCrisis;
