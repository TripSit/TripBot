/* eslint-disable */
import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { wikiGuides } from '../../../global/commands/g.guides';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dTemplate;

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('guides')
    .setDescription('Get a link to all the guides from our wiki')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),


  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });


    const guides = await wikiGuides();

    let message: string = '';

    for(const element of guides) {
      message += `[${element.split('_').join(' ')}](https://wiki.tripsit.me/wiki/${element})\n`;
    }

    const embed = embedTemplate().setTitle('Wiki Guides')
            .setDescription(`These are the guides currently available on our [Wiki](https://wiki.tripsit.me)\n\n${message}\nYou're welcome to contribute. :heart:`);
    

    interaction.editReply({embeds: [embed]});  

    return true;
  },
};
