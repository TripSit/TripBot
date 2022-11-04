import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import ms from 'ms';
import log from '../../../global/utils/log';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

export const botstats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Get stats about the bot!'),
  async execute(interaction) {
    log.debug(`[${PREFIX}] starting!`);
    // Get the number of guilds the bot is in
    const guildCount = interaction.client.guilds.cache.size;
    log.debug(`[${PREFIX}] guildCount: ${guildCount}`);
    // Get the number of users the bot can see
    const userCount = interaction.client.users.cache.size;
    log.debug(`[${PREFIX}] userCount: ${userCount}`);
    // Get the number of channels the bot can see
    const channelCount = interaction.client.channels.cache.size;
    log.debug(`[${PREFIX}] channelCount: ${channelCount}`);
    // Get the number of commands the bot has
    const commandCount = interaction.client.commands.size;
    log.debug(`[${PREFIX}] commandCount: ${commandCount}`);
    const uptime = (new Date().getTime() - global.bootTime.getTime());
    log.debug(`[${PREFIX}] uptime: ${uptime}`);


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
    log.debug(`[${PREFIX}] finished!`);
    interaction.reply({embeds: [embed]});
    return true;
  },
};
