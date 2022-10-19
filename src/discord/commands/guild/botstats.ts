import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import ms from 'ms';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

export const botstats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Get stats about the bot!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);
    // Get the number of guilds the bot is in
    const guildCount = interaction.client.guilds.cache.size;
    logger.debug(`[${PREFIX}] guildCount: ${guildCount}`);
    // Get the number of users the bot can see
    const userCount = interaction.client.users.cache.size;
    logger.debug(`[${PREFIX}] userCount: ${userCount}`);
    // Get the number of channels the bot can see
    const channelCount = interaction.client.channels.cache.size;
    logger.debug(`[${PREFIX}] channelCount: ${channelCount}`);
    // Get the number of commands the bot has
    const commandCount = interaction.client.commands.size;
    logger.debug(`[${PREFIX}] commandCount: ${commandCount}`);
    const uptime = (new Date().getTime() - global.bootTime.getTime());
    logger.debug(`[${PREFIX}] uptime: ${uptime}`);


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
    logger.debug(`[${PREFIX}] finished!`);
    interaction.reply({embeds: [embed]});
  },
};
