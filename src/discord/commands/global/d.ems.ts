import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { ems } from '../../../global/commands/g.ems';

export const emsCommand : SlashCommand = {
  data: new SlashCommandBuilder().setName('ems')
    .setDescription('Gets list of EMS Lines for the provided countries matching the query')
    .addStringOption(option => option.setName('country_search').setDescription('The string to search for country name').setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const data = await ems(interaction.options.getString('country_search') || '');
    if (data.length === 0) {
      await interaction.editReply(':x: No Countries Found');
      return true;
    }
    const fields = data.slice(0, 24).map(dataEntry => {
      let valueStr = dataEntry.LocalOnly
        ? 'Local numbers only'
        : `${dataEntry.Suicide ? `Suicide Hotline: \`${dataEntry.Suicide}\`` : ''}`
            + `${dataEntry.Ambulance.All && dataEntry.Ambulance.All[0] != null && dataEntry.Ambulance.All[0] != '' ? `\nAmbulance: ${dataEntry.Ambulance.All.map((num: string) => `\`${num}\``).join(', ')}` : ''}`
            + `${dataEntry.Ambulance.GSM || dataEntry.Ambulance.Fixed ? `\nAmbulance GSM: ${dataEntry.Ambulance.GSM ? dataEntry.Ambulance.GSM.map((num: string) => `\`${num}\``).join(', ') : ''}\nAmbulance Landline: ${dataEntry.Ambulance.Fixed ? dataEntry.Ambulance.Fixed.map((num: string) => `\`${num}\``).join(', ') : ''}` : ''}`
            + `${dataEntry.Police.All && dataEntry.Police.All[0] != null && dataEntry.Police.All[0] != '' ? `\nPolice: ${dataEntry.Police.All.map((num: string) => `\`${num}\``).join(', ')}` : ''}`
            + `${dataEntry.Police.GSM || dataEntry.Police.Fixed ? `\nPolice GSM: ${dataEntry.Police.GSM ? dataEntry.Police.GSM.map((num: string) => `\`${num}\``).join(', ') : ''}\nPolice Landline: ${dataEntry.Police.Fixed ? dataEntry.Police.Fixed.map((num: string) => `\`${num}\``).join(', ') : ''}` : ''}`
            + `${dataEntry.Fire.All && dataEntry.Fire.All[0] != null && dataEntry.Fire.All[0] != '' ? `\nFire: ${dataEntry.Fire.All.map((num: string) => `\`${num}\``).join(', ')}` : ''}`
            + `${dataEntry.Fire.GSM || dataEntry.Fire.Fixed ? `\nFire GSM: ${dataEntry.Fire.GSM ? dataEntry.Fire.GSM.map((num: string) => `\`${num}\``).join(', ') : ''}\nFire Landline: ${dataEntry.Fire.Fixed ? dataEntry.Fire.Fixed.map((num: string) => `\`${num}\``).join(', ') : ''}` : ''}`
            + `${dataEntry.Dispatch.All && dataEntry.Dispatch.All[0] != null && dataEntry.Dispatch.All[0] != '' && dataEntry.Dispatch.All[0].length > 0 ? `\nGeneral Dispatch: ${dataEntry.Dispatch.All.map((num: string) => `\`${num}\``).join(', ')}` : ''}`
            + `${dataEntry.Dispatch.GSM || dataEntry.Dispatch.Fixed ? `\nDispatch GSM: ${dataEntry.Dispatch.GSM ? dataEntry.Dispatch.GSM.map((num: string) => `\`${num}\``).join(', ') : ''}\nDispatch Landline: ${dataEntry.Dispatch.Fixed ? dataEntry.Dispatch.Fixed.map((num: string) => `\`${num}\``).join(', ') : ''}` : ''}`
            + `${dataEntry.Member_112 ? `\nDispatch Alias: \`112\` ` : ''}`;
      valueStr = valueStr.substring(0, 1024); // trim for discord
      if (!valueStr.trim()) {
          valueStr = 'No data available';

      }
      return {
        name: `**${dataEntry.Country.Name.substring(0, 256)}**`, // Limit name length
        value: valueStr,
        inline: true,
      };
    });
    const embed = embedTemplate().setFields(fields).setTitle(`EMS Numbers for countries matching: ${interaction.options.getString('country_search') || ''}`)/* .setDescription('\n**DONT HESITATE TO CALL EMS IF YOU OR SOMEONE YOU KNOW IS IN DANGER**') */;
    if (data.length > 24) {
      embed.setFooter({ text: 'Results clipped (24 Max). Narrow your search! • Dose Responsibly' });
    }
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};
export default emsCommand;
