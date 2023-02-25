/* eslint-disable */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
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
    .addBooleanOption(option => option
      .setName('ephemeral')
      .setDescription('Set to true to display privately')),


  async execute(interaction) {
    startLog(F, interaction);


    const guides = await wikiGuides();

    let message: string = '';

    for(const element of guides) {
      message += `[${element.split('_').join(' ')}](https://wiki.tripsit.me/wiki/${element})\n`;
    }

    const embed = embedTemplate().setTitle('Wiki Guides')
            .setDescription(`These are the guides currently available on our [Wiki](https://wiki.tripsit.me)\n\n${message}\nYou're welcome to contribute. :heart:`);
    

    const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') == true ? true : false);        
    interaction.reply({embeds: [embed], ephemeral: ephemeral});  

    return true;
  },
};
