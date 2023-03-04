import {
  SlashCommandBuilder,
} from 'discord.js';
import ms from 'ms';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';

const F = f(__filename);

export default dBotstats;

export const dBotstats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Get stats about the bot!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    // Get the number of guilds the bot is in
    const guildCount = interaction.client.guilds.cache.size;
    // log.debug(F, `guildCount: ${guildCount}`);
    // Get the number of users the bot can see
    const userCount = interaction.client.users.cache.size;
    // log.debug(F, `userCount: ${userCount}`);
    // Get the number of channels the bot can see
    const channelCount = interaction.client.channels.cache.size;
    // log.debug(F, `channelCount: ${channelCount}`);
    // Get the number of commands the bot has
    // @ts-ignore - This works so idk why it's complaining
    const commandCount = interaction.client.commands.size;
    // log.debug(F, `commandCount: ${commandCount}`);
    const uptime = global.bootTime
      ? (new Date().getTime() - global.bootTime.getTime())
      : 0;
    // log.debug(F, `uptime: ${uptime}`);

    // Create the embed
    const embed = embedTemplate();
    embed.setTitle('Bot Stats');
    embed.setDescription(stripIndents`
      Here are some stats about the bot!
      Guilds: ${guildCount.toString()}
      Users: ${userCount.toString()}
      Channels: ${channelCount.toString()}
      Commands: ${commandCount.toString()}
      Uptime: ${ms(uptime)}
    `);
    interaction.editReply({ embeds: [embed] });
    return true;
  },
};
