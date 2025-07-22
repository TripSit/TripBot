import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import ms from 'ms';

import type { SlashCommand } from '../../@types/commandDef';

import { botStats } from '../../../global/commands/g.botstats';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dBotstats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Get stats about the bot!')
    .setIntegrationTypes([0])
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const startTime = Date.now();
    log.info(F, `Command started at ${startTime}`);
    // log.info(F, await commandContext(interaction));
    log.info(F, 'Attempting to defer reply...');
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    log.info(F, `Reply deferred in ${Date.now() - startTime}ms`);

    // Check if the user is an admin
    const actorIsAdmin = interaction.user.id === env.DISCORD_OWNER_ID;
    const statData = await botStats();
    const drivePercentPadded = `${statData.driveUsage.toString()}%`.padEnd(3, ' ');
    const memPercentPadded = `${statData.memUsage.toString()}%`.padEnd(3, ' ');
    const cpuPercentPadded = `${statData.cpuUsage.toString()}%`.padEnd(3, ' ');
    const guildString = `Guilds:   ${statData.guildCount.toString()}`;
    const channelString = `Channels: ${statData.channelCount.toString()}`;
    const userString = `Users:    ${statData.userCount.toString()}`;
    const commandString = `Commands: ${statData.commandCount.toString()}`;
    const pingString = `Ping:     ${statData.ping.toString()}ms`;
    const botUptimeString = `Bot Up:   ${ms(statData.uptime)}`;

    const networkString = actorIsAdmin
      ? `Network:  ${statData.netDown} down, ${statData.netUp} up`
      : '';
    const cpuString = actorIsAdmin
      ? `CPU:      ${cpuPercentPadded} of ${statData.cpuCount.toString()} cores`
      : '';
    const memString = actorIsAdmin
      ? `Memory:   ${memPercentPadded} of ${statData.memTotal.toString()} MB`
      : '';
    const driveString = actorIsAdmin
      ? `Drive:    ${drivePercentPadded} of ${statData.driveTotal.toString()} GB`
      : '';
    const dbStr = actorIsAdmin ? `Drug DB:  ${statData.tsDbSize.toString()} TS, ${statData.tsPwDbSize.toString()} TS+PW` : ''; // eslint-disable-line
    const hostUptimeStr = actorIsAdmin ? `Host Up:  ${ms(statData.hostUptime)}` : '';

    const columns = [
      [guildString, dbStr],
      [channelString, memString],
      [userString, driveString],
      [commandString, cpuString],
      [botUptimeString, hostUptimeStr],
      [pingString, networkString],
    ];

    const longest = columns.reduce((long, string_) => Math.max(long, string_[0].length), 0);
    const message = columns.map((col) => `${col[0].padEnd(longest)}  ${col[1]}`).join('\n');

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
