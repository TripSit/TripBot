/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
  Message,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import { startLog } from '../../utils/startLog';

export default dLpm;

const F = f(__filename);

const interval = env.NODE_ENV === 'production' ? 1000 * 5 : 1000 * 3;

const channels = [
  env.CHANNEL_LOUNGE,
  env.CHANNEL_VIPLOUNGE,
  env.CHANNEL_GOLDLOUNGE,

  env.CHANNEL_TRIPSITMETA,
  env.CHANNEL_TRIPSIT,
  env.CHANNEL_OPENTRIPSIT1,

  env.CHANNEL_OPENTRIPSIT2,
  env.CHANNEL_WEBTRIPSIT1,
  env.CHANNEL_WEBTRIPSIT2,

  // env.CHANNEL_SANCTUARY,
  // env.CHANNEL_TREES,
  // env.CHANNEL_OPIATES,

  // env.CHANNEL_STIMULANTS,
  // env.CHANNEL_DISSOCIATIVES,
  // env.CHANNEL_PSYCHEDELICS,
];

export const dLpm: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lpm')
    .setDescription('Shows the lines per minute of the guild!'),
  async execute(interaction) {
    startLog(F, interaction);
    let embed = embedTemplate()
      .setTitle('Lines per minute')
      .setDescription('Loading...')
      .setColor(Colors.Blurple);

    const msg = await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    });

    embed = await checkLpm(interaction);

    msg.edit({
      embeds: [embed],
    });

    function checkTimers() {
      setTimeout(
        async () => {
          embed = await checkLpm(interaction);
          try {
            msg.edit({ embeds: [embed] });
            checkTimers();
          } catch (error) {
            //
          }
        },
        interval,
      );
    }
    checkTimers();

    return true;
  },
};

async function checkLpm(interaction:ChatInputCommandInteraction) {
  // log.debug(F, 'Checking LPM...');
  const embed = embedTemplate()
    .setTitle('Lines per minute')
    .setColor(Colors.Blurple);

  const descriptions = [['📜│Channel', 'LPM']] as string[][];

  for (const channelId of channels) { // eslint-disable-line no-restricted-syntax
    const channel = await interaction.guild?.channels.fetch(channelId) as TextChannel; // eslint-disable-line no-await-in-loop, max-len
    await channel.messages.fetch(); // eslint-disable-line no-await-in-loop
    const messages = await channel.messages.fetch({ limit: 100 }); // eslint-disable-line no-await-in-loop
    const lines = messages.reduce((acc, cur) => {
      if (cur.author.bot) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);
    if (lines > 0) {
      const lastMessage = messages.last() as Message;
      const minutes = (Date.now() - lastMessage.createdTimestamp) / 1000 / 60;
      const lpm = Math.round((lines / minutes) * 100) / 100;
      descriptions.push([channel.name, `${lpm}`]);
    }
  }

  // Get the largest channel.name from descriptions
  const largestChannelLength = descriptions.reduce((acc, cur) => {
    if (cur[0].length > acc) return cur[0].length;
    return acc;
  }, 0);

  // log.debug(F, `largestChannelLength: ${largestChannelLength}`);

  // For each channel name, add spaces to the end to make them all the same length
  const description = descriptions.map(d => {
    const spaces = largestChannelLength - d[0].length;
    const spaceString = '\ '.repeat(spaces); // eslint-disable-line no-useless-escape
    return `${d[0]}${spaceString} | ${d[1]}`;
  }).join('\n');

  embed.setDescription(`\`\`\`${description}
  \`\`\``);

  return embed;
}
