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
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import { startLog } from '../../utils/startLog';

export default dLpm;

const F = f(__filename);

const interval = env.NODE_ENV === 'production' ? 1000 * 5 : 1000 * 3;

export const dLpm: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lpm')
    .setDescription('Shows the lines per minute of the guild!'),
  async execute(interaction) {
    startLog(F, interaction);

    const embed = embedTemplate()
      .setTitle('Lines per minute')
      .setDescription('Loading...')
      .setColor(Colors.Blurple);

    const msg = await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    });

    function checkTimers() {
      setTimeout(
        async () => {
          const anotherOne = await checkLpm(msg);
          if (anotherOne) {
            checkTimers();
          }
        },
        interval,
      );
    }
    checkTimers();

    return true;
  },
};

async function checkLpm(msg:Message) {
  const embed = embedTemplate()
    .setTitle('Lines per minute')
    .setColor(Colors.Blurple);

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

  for (const channelId of channels) { // eslint-disable-line no-restricted-syntax
    const channel = await msg.guild?.channels.fetch(channelId) as TextChannel; // eslint-disable-line no-await-in-loop
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
      const lph = Math.round((lpm * 60) * 100) / 100;
      embed.addFields(
        { name: channel.name, value: `${lpm} LPM\n${lph} LPH`, inline: true },
      );
      if (channelId === env.CHANNEL_LOUNGE) {
        const description = `Out of ${messages.size} messages sent since ${Math.round(minutes)} minutes ago, ${lines} were human lines for ${lpm} LPM or ${lph} LPH`;
        // log.debug(F, description);
        embed.setDescription(description);
      }
    }
  }

  try {
    msg.edit({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}
