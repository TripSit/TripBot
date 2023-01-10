/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  TextChannel,
  GuildMember,
  Colors,
  TextBasedChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log'; // eslint-disable-line no-unused-vars

const F = f(__filename);

const reminderDict = {
  [`${env.CHANNEL_ANNOUNCEMENTS}`]: [
    'EmbedTitle',
    'EmbedDescription',
  ],
  [`${env.CHANNEL_BOTSPAM}`]: [
    'EmbedTitle',
    'EmbedDescription',
  ],
  [`${env.CHANNEL_MODHAVEN}`]: [
    'Keep team talk to #teamtripsit!',
    'While we love to see people discussing the org, we want to make sure everyone is on the same page. Please keep all team talk to #teamtripsit!',
  ],
  [`${env.CHANNEL_TEAMTRIPSIT}`]: [
    'Keep social talk to #modhaven!',
    'While we all love to have a good time, we want to keep this channel easy to scan for people to keep up with news and updates. Please keep social talk to #modhaven!',
  ],
  // [`${env.CHANNEL_GENERAL}`]: [
  //   'Keep #general welcoming and move drug talk to #lounge',
  //   '#general is the first channel new members see. To ensure we make a good impression, we ask that you move all NSFW conversation, including most drug-related talk, to #lounge or the appropriate Backstage channel to ensure a comfortable landing space for new members, thank you!',
  // ],
  [`${env.CHANNEL_SANCTUARY}`]: [
    'Keep #sanctuary slow and positive!',
    '#sanctuary is a positivity-enforced channel for people currently on substances. Please keep the conversation slow and positive, and remember that we are here to help!',
  ],
  // [`${env.CHANNEL_WEBTRIPSIT}`]: [
  //   'Keep #web-tripsit clear for people who need help!',
  //   'Reminder: this channel is for people who need immediate assistance or who have questions about harm reduction and safer drug use. To access our social chat channels, consider joining our discord at https://discord.gg/tripsit. Thank you!,',
  // ],
  [`${env.CHANNEL_WEBTRIPSIT1}`]: [
    'Keep #web-tripsit clear for people who need help!',
    'Reminder: this channel is for people who need immediate assistance or who have questions about harm reduction and safer drug use. To access our social chat channels, consider joining our discord at https://discord.gg/tripsit. Thank you!,',
  ],
  [`${env.CHANNEL_WEBTRIPSIT2}`]: [
    'Keep #web-tripsit clear for people who need help!',
    'Reminder: this channel is for people who need immediate assistance or who have questions about harm reduction and safer drug use. To access our social chat channels, consider joining our discord at https://discord.gg/tripsit. Thank you!,',
  ],
};

export default dReminder;

export const dReminder: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Sends a reminder on what the channel is for!'),
  async execute(interaction) {
    startLog(F, interaction);
    if (!interaction.guild) {
      interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      });
      return false;
    }

    // const { channelId } = interaction;
    // log.debug(F, `channelId: ${channelId}`);
    const chanId = (interaction.channel as TextBasedChannel).id;
    // log.debug(F, `chanId: ${chanId}`);
    const reminderData = reminderDict[chanId];
    // log.debug(F, `reminderData: ${JSON.stringify(reminderData, null, 2)}`);
    if (!reminderData) {
      interaction.reply({
        content: 'This command can only be used in a channel with a reminder!',
        ephemeral: true,
      });
      return false;
    }
    const reminderTitle = reminderData[0];
    // log.debug(F, `reminderTitle: ${reminderTitle}`);
    const reminderText = reminderData[1];
    // log.debug(F, `reminderText: ${reminderText}`);

    const reminder = embedTemplate()
      .setColor(Colors.Red)
      .setTitle(`REMINDER: ${reminderTitle}`)
      .setDescription(reminderText);

    await interaction.channel?.send({ embeds: [reminder] });

    const botlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (botlog) {
      await botlog.send(`${(interaction.member as GuildMember).displayName} sent a reminder to ${(interaction.channel as TextChannel).name}`);
    }
    interaction.reply({ content: 'Reminder sent!', ephemeral: true });
    return true;
  },
};
