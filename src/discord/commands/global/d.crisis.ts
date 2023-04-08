import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { crisis } from '../../../global/commands/g.crisis';
import { commandContext } from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dCrisis: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('crisis')
    .setDescription('Information that may be helpful in a serious situation.')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const emsInfo = await crisis();
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const embed = embedTemplate();

    embed.setTitle('Crisis Information');
    // for (const entry of emsInfo) {
    emsInfo.forEach(entry => {
      const country = `(${entry.country})`;
      const website = `\n[Website](${entry.website})`;
      const webchat = `\n[Webchat](${entry.webchat})`;
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
    return true;
  },
};

export default dCrisis;
