import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { warmline } from '../../../global/commands/g.warmline';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dWarmline: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('warmline')
    .setDescription('Need someone to talk to, but don\'t need a "hotline"?')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const emsInfo = await warmline();
    const embed = embedTemplate()
      .setTitle('Need someone to talk to, but don\'t need a "hotline"?');

    embed.setTitle('Warmline Information');
    // for (const entry of emsInfo) {
    emsInfo.forEach(entry => {
      const country = `(${entry.country})`;
      const website = `\n[Website](${entry.website})`;
      const webchat = `\n[Webchat](${entry.website})`;
      const phone = `\nCall: ${entry.phone}`;
      const text = `\nText: ${entry.text}`;
      embed.addFields(
        {
          name: `${entry.name} ${entry.country ? country : ''}`,
          value: stripIndents`${entry.website ? website : ''}\
            ${entry.webchat ? webchat : ''}\
            ${entry.phone ? phone : ''}\
            ${entry.text ? text : ''}`,
          inline: true,
        },
      );
    });
    await interaction.editReply({ embeds: [embed] });
    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    return true;
  },
};

export default dWarmline;
