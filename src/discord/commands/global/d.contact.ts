import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { contact } from '../../../global/commands/g.contact';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';

const PREFIX = parse(__filename).name;

export default dContact;

export const dContact: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('contact')
    .setDescription('How to contact TripSit!'),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const contactInfo = await contact();
    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('Contact TripSit')
      .setURL(contactInfo.url)
      .setDescription(
        stripIndents`The best way to get in contact with TeamTripsit the Discord via the link below!
        If you have a problem with the bot, join the discord and talk to ${contactInfo.botOwner}!
        Or you can use /bug to report a bug, or you can DM the bot to submit feedback!`,
      )
      .addFields(
        { name: 'Discord', value: `[Join our discord](${contactInfo.discord})`, inline: true },
        // {name: 'Webchat', value: `[Webchat](${contactInfo.discord})`},
        { name: 'Bot Issues Email', value: `${contactInfo.botEmail}`, inline: true },
        { name: 'Drug Info Issues Email', value: `${contactInfo.contentEmail}`, inline: true },
      )
      .setFooter({ text: 'Thanks for asking!' });
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
