import {
  SlashCommandBuilder,
} from 'discord.js';
import ms from 'ms';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { botStats } from '../../../global/commands/g.botstats';

const F = f(__filename);

export const dBotstats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Get stats about the bot!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const startTime = new Date().getTime();
    log.info(F, `Command started at ${startTime}`);
    // log.info(F, await commandContext(interaction));
    log.info(F, 'Attempting to defer reply...');
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    log.info(F, `Reply deferred in ${new Date().getTime() - startTime}ms`);

    // Check if the user is an admin
    const actorIsAdmin = interaction.user.id === env.DISCORD_OWNER_ID;
    const statData = await botStats();
    const drivePercentPadded = `${statData.driveUsage.toString()}%`.padEnd(3, ' ');
    const memPercentPadded = `${statData.memUsage.toString()}%`.padEnd(3, ' ');
    const cpuPercentPadded = `${statData.cpuUsage.toString()}%`.padEnd(3, ' ');
    const guildStr = `Guilds:   ${statData.guildCount.toString()}`;
    const channelStr = `Channels: ${statData.channelCount.toString()}`;
    const userStr = `Users:    ${statData.userCount.toString()}`;
    const commandStr = `Commands: ${statData.commandCount.toString()}`;
    const pingStr = `Ping:     ${statData.ping.toString()}ms`;
    const botUptimeStr = `Bot Up:   ${ms(statData.uptime)}`;

    const networkStr = actorIsAdmin ? `Network:  ${statData.netDown} down, ${statData.netUp} up` : '';
    const cpuStr = actorIsAdmin ? `CPU:      ${cpuPercentPadded} of ${statData.cpuCount.toString()} cores` : '';
    const memStr = actorIsAdmin ? `Memory:   ${memPercentPadded} of ${statData.memTotal.toString()} MB` : '';
    const driveStr = actorIsAdmin ? `Drive:    ${drivePercentPadded} of ${statData.driveTotal.toString()} GB` : '';
    const dbStr = actorIsAdmin ? `Drug DB:  ${statData.tsDbSize.toString()} TS, ${statData.tsPwDbSize.toString()} TS+PW` : ''; // eslint-disable-line
    const hostUptimeStr = actorIsAdmin ? `Host Up:  ${ms(statData.hostUptime)}` : '';

    const columns = [
      [guildStr, dbStr],
      [channelStr, memStr],
      [userStr, driveStr],
      [commandStr, cpuStr],
      [botUptimeStr, hostUptimeStr],
      [pingStr, networkStr],
    ];

    const longest = columns.reduce((long, str) => Math.max(long, str[0].length), 0);
    const message = columns.map(col => `${col[0].padEnd(longest)}  ${col[1]}`).join('\n');

    // Create the embed
    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setTitle('Bot Stats')
      .setDescription(`\`\`\`${message}\`\`\``);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dBotstats;
