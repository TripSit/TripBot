import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import ms from 'ms';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { botStats } from '../../../global/commands/g.botstats';

const F = f(__filename);

export const dBotstats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Get stats about the bot!')
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    const startTime = Date.now();
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;

    await interaction.deferReply({ flags: ephemeral });
    log.info(F, `Reply deferred in ${Date.now() - startTime}ms`);

    const statData = await botStats();
    const actorIsAdmin = interaction.user.id === env.DISCORD_OWNER_ID;

    // --- Column 1: Bot & Discord Stats ---
    const guildStr = `Guilds:   ${statData.guildCount}`;
    const userStr = `Users:    ${statData.userCount}`;
    const commandStr = `Commands: ${statData.commandCount}`;
    const dbSizeStr = `Drug DB:  ${statData.tsDbSize}TS / ${statData.tsPwDbSize}PW`;
    const botUptimeStr = `Bot Up:   ${ms(statData.uptime)}`;
    const pingStr = `Ping:     ${statData.ping}ms`;

    // --- Column 2: System & Health (Admin Only) ---
    // Using a simple indicator for DB health
    const dbHealth = `DB Health: Tripbot:${statData.dbTripbotStatus === 'Online' ? '✔' : '✘'} Moodle:${statData.dbMoodleStatus === 'Online' ? '✔' : '✘'}`;
    const nodeMemStr = `Node Heap: ${statData.nodeHeapUsed} / ${statData.nodeHeapTotal} MB`;
    const cpuStr = `CPU:      ${statData.cpuUsage}% of ${statData.cpuCount} cores`;
    const memStr = `Sys Mem:  ${statData.memUsage}% of ${statData.memTotal} MB`;
    const driveStr = `Drive:    ${statData.driveUsage}% of ${statData.driveTotal} GB`;
    const netStr = `Net:      ${statData.netDown}↓ ${statData.netUp}↑ MB`;
    const hostUpStr = `Host Up:  ${ms(statData.hostUptime * 1000)}`; // os-utils returns seconds, ms() expects ms

    const columns = [
      [guildStr, dbHealth],
      [userStr, nodeMemStr],
      [commandStr, cpuStr],
      [dbSizeStr, memStr],
      [botUptimeStr, driveStr],
      [pingStr, netStr],
    ];

    // Add Host Uptime as a separate row if Admin
    if (actorIsAdmin) {
      columns.push(['', hostUpStr]);
    }

    // Dynamic padding logic
    const longest = columns.reduce((long, str) => Math.max(long, str[0].length), 0);
    const message = columns
      .map(col => {
        // If the user isn't an admin, we only show the first column
        if (!actorIsAdmin) return col[0];
        return `${col[0].padEnd(longest)}   ${col[1]}`;
      })
      .join('\n');

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `Generated in ${Date.now() - startTime}ms` })
      .setTitle('🚀 TripBot System Status')
      .setDescription(`\`\`\`ml\n${message}\`\`\``); // 'ml' formatting adds a bit of color coding in Discord

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dBotstats;
