/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  TextChannel,
  GuildMember,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {startLog} from '../../utils/startLog';
import env from '../../../global/utils/env.config';
import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;


export const reminder: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Sends a reminder on what the channel is for!'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    if (!interaction.guild) {
      interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      });
      return false;
    }

    log.debug(`[${PREFIX}] starting!`);

    const reminder = embedTemplate()
      .setColor(Colors.Red)
      .setTitle(`REMINDER: ${reminderDict[interaction.channelId][0]}`)
      .setDescription(reminderDict[interaction.channelId][1]);

    interaction.channel?.send({embeds: [reminder]});

    interaction.reply({content: 'Reminder sent!', ephemeral: true});

    const channelBotlog = interaction.guild.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      channelBotlog.send(`${(interaction.member as GuildMember).displayName} sent a reminder to ${(interaction.channel as TextChannel).name}`);
    }
    return true;
  },
};

const reminderDict = {
  [env.CHANNEL_ANNOUNCEMENTS]: [
    `EmbedTitle`,
    `EmbedDescription`,
  ],
  [env.CHANNEL_MODHAVEN]: [
    `Keep team talk to #teamtripsit!`,
    `While we love to see people discussing the org, we want to make sure everyone is on the same page. Please keep all team talk to #teamtripsit!`,
  ],
  [env.CHANNEL_TEAMTRIPSIT]: [
    'Keep social talk to #modhaven!',
    'While we all love to have a good time, we want to keep this channel easy to scan for people to keep up with news and updates. Please keep social talk to #modhaven!',
  ],
  [env.CHANNEL_GENERAL]: [
    'Keep #general welcoming and move drug talk to #lounge',
    '#general is the first channel new members see. To ensure we make a good impression, we ask that you move all NSFW conversation, including most drug-related talk, to #lounge or the appropriate Backstage channel to ensure a comfortable landing space for new members, thank you!',
  ],
  [env.CHANNEL_SANCTUARY]: [
    'Keep #sanctuary slow and positive!',
    '#sanctuary is a positivity-enforced channel for people currently on substances. Please keep the conversation slow and positive, and remember that we are here to help!',
  ],
  [env.CHANNEL_WEBTRIPSIT]: [
    'Keep #web-tripsit clear for people who need help!',
    'Reminder: this channel is for people who need immediate assistance or who have questions about harm reduction and safer drug use. To access our social chat channels, consider joining our discord at https://discord.gg/tripsit. Thank you!,',
  ],
  [env.CHANNEL_WEBTRIPSIT1]: [
    'Keep #web-tripsit clear for people who need help!',
    'Reminder: this channel is for people who need immediate assistance or who have questions about harm reduction and safer drug use. To access our social chat channels, consider joining our discord at https://discord.gg/tripsit. Thank you!,',
  ],
  [env.CHANNEL_WEBTRIPSIT2]: [
    'Keep #web-tripsit clear for people who need help!',
    'Reminder: this channel is for people who need immediate assistance or who have questions about harm reduction and safer drug use. To access our social chat channels, consider joining our discord at https://discord.gg/tripsit. Thank you!,',
  ],
};
