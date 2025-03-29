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

// Editable configuration variables
const busynessConfig = {
  messageWeight: 0.5,
  userWeight: 2,
  distributionWeight: 50,
  activityDensityWeight: 1.5,
  busynessThreshold: 150,
};

const interval = 30 * 1000; // Check every 30 seconds
const embedTitle = 'Shows the busyness score of #lounge';
const header = 'Busyness score is being calculated...'; // Provide a default value

let msg: any; // To store the embed message reference
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
  const busynessScore = messageCount * busynessConfig.messageWeight
    + userCount * busynessConfig.userWeight
    + distributionFactor * busynessConfig.distributionWeight
    - activityDensity * busynessConfig.activityDensityWeight;

  return {
    busynessScore,
    messageCount,
    userCount,
    distributionFactor,
    activityDensity,
  };
}

async function checkBusyness() {
  const channel = msg.channel as TextChannel;
  if (!channel) {
    log.error(F, 'Lounge channel not found.');
    return;
  }

  const oneMinuteAgo = Date.now() - 60 * 1000;
  const recentMessages = channel.messages.cache.filter(
    message => message.createdTimestamp > oneMinuteAgo && !message.author.bot,
  );

  if (recentMessages.size === 0) {
    log.debug(F, 'No new messages in the last minute. Skipping busyness check.');
    setTimeout(checkBusyness, interval); // Schedule the next check
    return;
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

  const now = Date.now(); // Current timestamp
  const nextCheck = now + interval; // Timestamp for the next check

  const embed = embedTemplate()
    .setTitle(embedTitle)
    .setDescription(
      `**Formula:** \`Busyness = (M * ${busynessConfig.messageWeight}) + (U * ${busynessConfig.userWeight}) + (D * ${busynessConfig.distributionWeight}) - (A * ${busynessConfig.activityDensityWeight})\`\n\n`
      + `**Enable Threshold:** ${busynessConfig.busynessThreshold}\n`
      + `**Disable Threshold:** ${busynessConfig.busynessThreshold * 0.75}\n\n`
      + `**Last Check:** <t:${Math.floor(now / 1000)}:R>\n`
      + `**Next Check:** <t:${Math.floor(nextCheck / 1000)}:R>\n\n`,
    )
    .addFields(
      {
        name: `Current Busyness Score: ${busynessScore.toFixed(2)}`,
        value:
          '```\n'
          + 'Component            Value       Raw Contribution\n'
          + '------------------------------------------------\n'
          + `Messages (M):        ${String(messageCount).padStart(10)} ${String((messageCount * busynessConfig.messageWeight).toFixed(2)).padStart(10)}\n`
          + `Unique Users (U):    ${String(userCount).padStart(10)} ${String((userCount * busynessConfig.userWeight).toFixed(2)).padStart(10)}\n`
          + `Distribution (D):    ${String((distributionFactor * 100).toFixed(2)).padStart(10)} ${String((distributionFactor * busynessConfig.distributionWeight).toFixed(2)).padStart(10)}\n`
          + `Activity (A):        ${String(activityDensity.toFixed(2)).padStart(10)} ${String((-activityDensity * busynessConfig.activityDensityWeight).toFixed(2)).padStart(10)}\n`
          + '```',
        inline: false,
      },
      {
        name: `Maximum Busyness Score: ${maxBusynessScore.toFixed(2)}`,
        value:
          '```\n'
          + 'Component            Value       Raw Contribution\n'
          + '------------------------------------------------\n'
          + `Messages (M):        ${String(maxBusynessDetails.messageCount).padStart(10)} ${String((maxBusynessDetails.messageCount * busynessConfig.messageWeight).toFixed(2)).padStart(10)}\n`
          + `Unique Users (U):    ${String(maxBusynessDetails.userCount).padStart(10)} ${String((maxBusynessDetails.userCount * busynessConfig.userWeight).toFixed(2)).padStart(10)}\n`
          + `Distribution (D):    ${String((maxBusynessDetails.distributionFactor * 100).toFixed(2)).padStart(10)} ${String((maxBusynessDetails.distributionFactor * busynessConfig.distributionWeight).toFixed(2)).padStart(10)}\n`
          + `Activity (A):        ${String(maxBusynessDetails.activityDensity.toFixed(2)).padStart(10)} ${String((-maxBusynessDetails.activityDensity * busynessConfig.activityDensityWeight).toFixed(2)).padStart(10)}\n`
          + '```',
        inline: false,
      },
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

export const dBusyness: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('busyness')
    .setDescription('Manage the busyness score of #lounge')
    .addSubcommand(subcommand => subcommand
      .setName('post')
      .setDescription('Post the busyness embed')
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Update the busyness configuration')
      .addStringOption(option => option
        .setName('key')
        .setDescription('The configuration key to update')
        .setRequired(true)
        .addChoices(
          { name: 'Message Weight', value: 'messageWeight' },
          { name: 'User Weight', value: 'userWeight' },
          { name: 'Distribution Weight', value: 'distributionWeight' },
          { name: 'Activity Density Weight', value: 'activityDensityWeight' },
          { name: 'Busyness Threshold', value: 'busynessThreshold' },
        ))
      .addNumberOption(option => option
        .setName('value')
        .setDescription('The new value for the configuration key')
        .setRequired(true))) as SlashCommandBuilder,
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

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'post') {
      // Handle the "post" subcommand
      await interaction.deferReply({
        flags: interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined,
      });

      msg = await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle(embedTitle)
          .setDescription(header)
          .setColor(Colors.Blurple)
          .setFooter(null)],
      });

      // Start the busyness check loop
      checkBusyness();
    } else if (subcommand === 'set') {
      // Handle the "set" subcommand
      const key = interaction.options.getString('key', true);
      const value = interaction.options.getNumber('value', true);

      // Update the configuration
      busynessConfig[key as keyof typeof busynessConfig] = value;

      await interaction.reply({
        content: `Updated \`${key}\` to \`${value}\`.`,
        ephemeral: true,
      });

      log.debug(F, `Updated busynessConfig: ${key} = ${value}`);
    }

    return true;
  },
};

export default dBusyness;
