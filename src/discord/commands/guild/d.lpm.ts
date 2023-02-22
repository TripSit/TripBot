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
          await checkLpm(msg);
          checkTimers();
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

  const channel = msg.channel as TextChannel;
  await channel.messages.fetch();
  const messages = await channel.messages.fetch({ limit: 100 });
  const lines = messages.reduce((acc, cur) => {
    if (cur.author.bot) return acc;
    return acc + cur.content.split('\n').length;
  }, 0);
  if (lines > 0) {
    const lastMessage = messages.last() as Message;
    const minutes = (Date.now() - lastMessage.createdTimestamp) / 1000 / 60;
    const lpm = Math.round((lines / minutes) * 100) / 100;
    const lph = Math.round((lpm * 60) * 100) / 100;
    const description = `Out of ${messages.size} messages sent since ${Math.round(minutes)} minutes ago, ${lines} were human lines for ${lpm} LPM or ${lph} LPH`;
    // log.debug(F, description); // eslint-disable-line max-len
    embed.setDescription(description); // eslint-disable-line max-len
    msg.edit({ embeds: [embed] });
  } else {
    // log.debug(F, `No human lines found in ${channel.name} in the last two weeks (or ever)`);
    embed.setDescription(`No human lines found in ${channel.name} in the last two weeks (or ever)`);
    msg.edit({ embeds: [embed] });
  }
}
