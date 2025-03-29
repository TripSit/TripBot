import {
  Colors,
  SlashCommandBuilder,
  TextChannel,
  MessageFlags,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

const interval = 30 * 1000; // Check every 30 seconds
const busynessThreshold = 100; // Set the busyness score limit

const embedTitle = 'Shows the busyness score of #lounge';
const header = 'Busyness score is being calculated...'; // Provide a default value

export const dBusyness: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('busyness')
    .setDescription('Shows the busyness of #lounge')
    .addBooleanOption(option => option
      .setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.debug(F, await commandContext(interaction));

    // Check if the user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return false;
    }

    await interaction.deferReply({
      flags: interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined,
    });

    const msg = await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle(embedTitle)
        .setDescription(header)
        .setColor(Colors.Blurple)
        .setFooter(null)],
    });

    // Variables to track the maximum recorded busyness score
    let maxBusynessScore = 0;
    let maxBusynessDetails = {
      messageCount: 0,
      userCount: 0,
      distributionFactor: 0,
      activityDensity: 0,
    };

    async function calculateBusyness(
      channel: TextChannel,
    ): Promise<{
        busynessScore: number;
        messageCount: number;
        userCount: number;
        distributionFactor: number;
        activityDensity: number;
      }> {
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;

      // Use the built-in message cache
      const recentMessages = channel.messages.cache.filter(
        message => message.createdTimestamp > oneMinuteAgo && !message.author.bot,
      );

      const uniqueUsers = new Set(recentMessages.map(message => message.author.id));
      const userMessageCounts: { [userId: string]: number } = {};

      // Count messages per user
      recentMessages.forEach(message => {
        userMessageCounts[message.author.id] = (userMessageCounts[message.author.id] || 0) + 1;
      });

      const messageCount = recentMessages.size;
      const userCount = uniqueUsers.size;

      // Calculate the distribution factor (D)
      const maxMessages = Math.max(...Object.values(userMessageCounts));
      const distributionFactor = messageCount > 0 ? 1 - maxMessages / messageCount : 0;

      // Calculate the activity density (A)
      const activityDensity = userCount > 0 ? messageCount / userCount : 0;

      // Calculate the final busyness score
      const busynessScore = messageCount * 0.5
        + userCount * 2
        + distributionFactor * 50
        - activityDensity * 1.5;

      return {
        busynessScore,
        messageCount,
        userCount,
        distributionFactor,
        activityDensity,
      };
    }

    const scoreHistory: number[] = [];
    let slowmodeEnabled = false;
    let aboveThresholdChecks = 0;
    let belowThresholdChecks = 0;

    async function checkBusyness() {
      const channel = interaction.guild?.channels.cache.get(env.CHANNEL_LOUNGE) as TextChannel;
      if (!channel) {
        log.error(F, 'Lounge channel not found.');
        return;
      }

      // Check if there are any new messages in the cache
      const oneMinuteAgo = Date.now() - 60 * 1000;
      const recentMessages = channel.messages.cache.filter(
        message => message.createdTimestamp > oneMinuteAgo && !message.author.bot,
      );

      if (recentMessages.size === 0) {
        log.debug(F, 'No new messages in the last minute. Skipping busyness check.');
        setTimeout(checkBusyness, interval); // Schedule the next check
        return;
      }

      // Check if the embed message still exists
      try {
        await msg.fetch();
      } catch (error) {
        log.debug(F, 'Embed message was deleted. Stopping busyness checks.');
        return; // Stop the process if the embed is deleted
      }

      const {
        busynessScore, messageCount, userCount, distributionFactor, activityDensity,
      } = await calculateBusyness(channel);

      // Update the maximum recorded busyness score if the current score is higher
      if (busynessScore > maxBusynessScore) {
        maxBusynessScore = busynessScore;
        maxBusynessDetails = {
          messageCount,
          userCount,
          distributionFactor,
          activityDensity,
        };
      }

      // Add the current score to the history
      scoreHistory.push(busynessScore);
      if (scoreHistory.length > 2) {
        scoreHistory.shift(); // Keep only the last 2 scores
      }

      // Log the current score and history
      log.debug(F, `Current Busyness Score: ${busynessScore.toFixed(2)}`);
      log.debug(F, `Score History: ${scoreHistory.map(score => score.toFixed(2)).join(', ')}`);

      // Hysteresis logic
      if (busynessScore > busynessThreshold) {
        aboveThresholdChecks = Math.min(aboveThresholdChecks + 1, 2);
        belowThresholdChecks = 0;
        log.debug(F, `Above threshold for ${aboveThresholdChecks} consecutive checks.`);
        if (aboveThresholdChecks >= 2 && !slowmodeEnabled) {
          log.debug(F, 'Slowmode would be enabled.');
          slowmodeEnabled = true;
        }
      } else if (busynessScore <= busynessThreshold * 0.75) {
        belowThresholdChecks = Math.min(belowThresholdChecks + 1, 2);
        aboveThresholdChecks = 0;
        log.debug(F, `Below 75% threshold for ${belowThresholdChecks} consecutive checks.`);
        if (belowThresholdChecks >= 2 && slowmodeEnabled) {
          log.debug(F, 'Slowmode would be disabled.');
          slowmodeEnabled = false;
        }
      } else {
        // Reset both counters if the score is between thresholds
        aboveThresholdChecks = 0;
        belowThresholdChecks = 0;
      }

      const now = Date.now(); // Current timestamp
      const nextCheck = now + interval; // Timestamp for the next check

      const embed = embedTemplate()
        .setTitle(embedTitle)
        .setDescription(
          `**Current Busyness Score:** ${busynessScore.toFixed(2)}\n`
          + '**Formula:** `Busyness = (M * 0.5) + (U * 2) + (D * 50) - (A * 1.5)`\n\n'
          + '**Components:**\n'
          + `- **M (Messages):** ${messageCount}\n`
          + `- **U (Unique Users):** ${userCount}\n`
          + `- **D (Distribution Factor):** ${(distributionFactor * 100).toFixed(2)}%\n`
          + `- **A (Activity Density):** ${activityDensity.toFixed(2)}\n\n`
          + `**Max Recorded Busyness Score:** ${maxBusynessScore.toFixed(2)}\n`
          + '**Max Components:**\n'
          + `- **M (Messages):** ${maxBusynessDetails.messageCount}\n`
          + `- **U (Unique Users):** ${maxBusynessDetails.userCount}\n`
          + `- **D (Distribution Factor):** ${(maxBusynessDetails.distributionFactor * 100).toFixed(2)}%\n`
          + `- **A (Activity Density):** ${maxBusynessDetails.activityDensity.toFixed(2)}\n\n`
          + `**Enable Threshold:** ${busynessThreshold}\n`
          + `**Disable Threshold:** ${busynessThreshold * 0.75}\n\n`
          + `**Last Check:** <t:${Math.floor(now / 1000)}:R>\n`
          + `**Next Check:** <t:${Math.floor(nextCheck / 1000)}:R>\n\n`
          + `**Slowmode Status:** ${slowmodeEnabled ? 'Enabled' : 'Disabled'}\n`
          + `**Above Threshold Checks:** ${aboveThresholdChecks} (out of 2)\n`
          + `**Below Threshold Checks:** ${belowThresholdChecks} (out of 2)`,
        )
        .setColor(Colors.Blurple);

      try {
        await msg.edit({ embeds: [embed] });
      } catch (error) {
        log.debug(F, 'Failed to update embed. Embed might have been deleted.');
        return; // Stop the process if the embed cannot be updated
      }

      setTimeout(checkBusyness, interval);
    }

    checkBusyness();

    return true;
  },
};

export default dBusyness;
