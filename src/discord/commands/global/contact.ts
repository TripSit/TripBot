import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const contact: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('contact')
    .setDescription('How to contact TripSit!'),

  async execute(interaction) {
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle('Contact TripSit')
      .setURL('https://tripsit.me/contact-us/')
      .setDescription(`
        This app is created by TripSit, an organisation which helps to provide factual information about
        drugs and how to reduce the harms involved in using them.
      `)
      .addFields(
        {
          name: 'Discord',
          // eslint-disable-next-line max-len
          value: '[Join our discord](http://discord.gg/TripSit)\nTalk to one of the admins.\nThis is the quickest/easiest way to get in contact with Moonbear (bot owner)',
        },
        {name: 'Webchat', value: '[Webchat](http://chat.tripsit.me)'},
        {name: 'Bot Issues Email', value: 'discord_bot @ tripsit (dot) me'},
        {name: 'Drug Information Issues Email', value: 'content @ tripsit (dot) me'},
      )
      .setFooter({text: 'Thanks for asking!'});
    interaction.reply({embeds: [embed], ephemeral: false});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
