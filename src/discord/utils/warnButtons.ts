import {
  ButtonInteraction,
  Colors,
  TextChannel,
} from 'discord.js';
import { embedTemplate } from './embedTemplate';

const F = f(__filename); // eslint-disable-line

/**
 * Template
 * @param {Client} client The Client that manages this interaction
 * @return {Promise<void>}
* */
export async function acceptWarning(interaction:ButtonInteraction): Promise<void> {
  // log.debug(F, `guildId: ${env.DISCORD_GUILD_ID}`);
  // log.debug(F, `client: ${client}`);
  const modChan = interaction.client.channels.cache.get(env.CHANNEL_MODERATORS) as TextChannel;
  const embed = embedTemplate()
    .setColor(Colors.Green)
    .setDescription(`${interaction.user.username} has acknowledged their warning.`);
  if (modChan) {
    await modChan.send({ embeds: [embed] });
  }
  interaction.reply('Thanks for understanding!');
}

/**
 * Template
 * @param {Client} client The Client that manages this interaction
 * @return {Promise<void>}
* */
export async function refuseWarning(interaction:ButtonInteraction): Promise<void> {
  const guild = interaction.client.guilds.resolve(env.DISCORD_GUILD_ID);
  // log.debug(guild);
  const modChan = interaction.client.channels.cache.get(env.CHANNEL_MODERATORS) as TextChannel;
  if (guild) {
    guild.members.ban(interaction.user, { deleteMessageDays: 0, reason: 'Refused warning' });
  }
  const embed = embedTemplate()
    .setColor(Colors.Red)
    .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
  await modChan.send({ embeds: [embed] });
  interaction.reply('Thanks for making this easy!');
}
