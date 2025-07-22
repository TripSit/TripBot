import type { Message, TextChannel } from 'discord.js';

import { Colors, MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

// Editable configuration variables
const busynessConfig = {
  busynessThreshold: 100,
  densityWeight: 3,
  messageWeight: 3,
  spamminessWeight: 15,
  userWeight: 3.5,
};

const interval = 30 * 1000; // Check every 30 seconds
const embedTitle = 'Shows the busyness score of #lounge';
const header = 'Busyness score is being calculated...'; // Provide a default value

let message: Message;
let maxBusynessScore = 0;
let maxBusynessDetails = {
  density: 0,
  messageCount: 0,
  spamminess: 0,
  userCount: 0,
};

async function calculateBusyness(channel: TextChannel): Promise<{
  busynessScore: number;
  density: number;
  messageCount: number;
  spamminess: number;
  userCount: number;
}> {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Use the built-in message cache
  const recentMessages = channel.messages.cache.filter(
    (messageData) => messageData.createdTimestamp > oneMinuteAgo && !messageData.author.bot,
  );

  const uniqueUsers = new Set(recentMessages.map((messageData) => messageData.author.id));
  const userMessageCounts = new Map<string, number>();
  for (const [, messageData] of recentMessages) {
    userMessageCounts.set(
      messageData.author.id,
      (userMessageCounts.get(messageData.author.id) ?? 0) + 1,
    );
  }

  const messageCount = recentMessages.size;
  const userCount = uniqueUsers.size;

  // Calculate the Spamminess (S)
  const messageCounts = Object.values(userMessageCounts);
  const n = messageCounts.length;
  const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);

  let spamminess = 0;
  if (n > 0 && totalMessages > 0) {
    let cumulativeSum = 0;
    let magicNumerator = 0;

    for (const [index, count] of messageCounts.entries()) {
      cumulativeSum += count;
      magicNumerator += (index + 1) * count; // Adjust index logic if needed
    }

    spamminess = 1 - (2 * magicNumerator) / (n * cumulativeSum);
    spamminess = Math.min(Math.max(spamminess, 0), 1);
  }

  // Calculate the Density (D)
  const density = userCount > 0 ? messageCount / userCount : 0;

  // Calculate the final busyness score
  const busynessScore =
    messageCount * busynessConfig.messageWeight +
    userCount * busynessConfig.userWeight +
    spamminess * busynessConfig.spamminessWeight -
    density * busynessConfig.densityWeight;

  return {
    busynessScore,
    density,
    messageCount,
    spamminess,
    userCount,
  };
}

let loungeChannel: null | TextChannel = null; // Cache the channel object

async function checkBusyness() {
  const startTime = Date.now(); // Start timing
  const now = startTime; // Use a single `now` variable for consistency

  // Fetch the channel only once and reuse it
  if (!loungeChannel) {
    try {
      loungeChannel = (await message.client.channels.fetch(env.CHANNEL_LOUNGE)) as TextChannel;
      log.debug(F, 'Fetched lounge channel.');
    } catch {
      log.error(F, 'Failed to fetch lounge channel');
      return;
    }
  }

  const fetchStart = now;
  // Preload the message cache if it's empty
  if (loungeChannel.messages.cache.size === 0) {
    await loungeChannel.messages.fetch({ limit: 100 });
    log.debug(F, `Preloaded message cache in ${Date.now() - fetchStart}ms.`);
  }

  const oneMinuteAgo = now - 60 * 1000;

  // Filter recent messages
  const recentMessages = loungeChannel.messages.cache.filter(
    (message) => message.createdTimestamp > oneMinuteAgo && !message.author.bot,
  );

  if (recentMessages.size === 0) {
    log.debug(F, 'No new messages in the last minute. Skipping busyness check.');
    setTimeout(checkBusyness, interval); // Schedule the next check
    return;
  }

  const { busynessScore, density, messageCount, spamminess, userCount } =
    await calculateBusyness(loungeChannel);

  // Update the maximum recorded busyness score if the current score is higher
  if (busynessScore > maxBusynessScore) {
    maxBusynessScore = busynessScore;
    maxBusynessDetails = {
      density,
      messageCount,
      spamminess,
      userCount,
    };
    log.debug(F, 'Updated maximum busyness score.');
  }

  const nextCheck = now + interval; // Timestamp for the next check

  const embed = embedTemplate()
    .setTitle(embedTitle)
    .setDescription(
      `**Formula:** \`Busyness = (M * ${busynessConfig.messageWeight}) + (U * ${busynessConfig.userWeight}) + (S * ${busynessConfig.spamminessWeight}) - (D * ${busynessConfig.densityWeight})\`\n\n` +
        `**Enable Threshold:** ${busynessConfig.busynessThreshold}\n` +
        `**Disable Threshold:** ${busynessConfig.busynessThreshold * 0.75}\n\n` +
        `**Last Check:** <t:${Math.floor(now / 1000)}:R>\n` +
        `**Next Check:** <t:${Math.floor(nextCheck / 1000)}:R>\n\n`,
    )
    .addFields(
      {
        inline: false,
        name: `Current Busyness Score: ${busynessScore.toFixed(2)}`,
        value:
          '```\n' +
          'Component            Value       Raw Contribution\n' +
          '------------------------------------------------\n' +
          `Messages (M):        ${String(messageCount).padStart(10)} ${String((messageCount * busynessConfig.messageWeight).toFixed(2)).padStart(10)}\n` +
          `Unique Users (U):    ${String(userCount).padStart(10)} ${String((userCount * busynessConfig.userWeight).toFixed(2)).padStart(10)}\n` +
          `Spamminess (S):      ${String(spamminess.toFixed(2)).padStart(10)} ${String((spamminess * busynessConfig.spamminessWeight).toFixed(2)).padStart(10)}\n` +
          `Density (D):         ${String(density.toFixed(2)).padStart(10)} ${String((-density * busynessConfig.densityWeight).toFixed(2)).padStart(10)}\n` +
          '```',
      },
      {
        inline: false,
        name: `Maximum Busyness Score: ${maxBusynessScore.toFixed(2)}`,
        value:
          '```\n' +
          'Component            Value       Raw Contribution\n' +
          '------------------------------------------------\n' +
          `Messages (M):        ${String(maxBusynessDetails.messageCount).padStart(10)} ${String((maxBusynessDetails.messageCount * busynessConfig.messageWeight).toFixed(2)).padStart(10)}\n` +
          `Unique Users (U):    ${String(maxBusynessDetails.userCount).padStart(10)} ${String((maxBusynessDetails.userCount * busynessConfig.userWeight).toFixed(2)).padStart(10)}\n` +
          `Spamminess (S):      ${String(maxBusynessDetails.spamminess.toFixed(2)).padStart(10)} ${String((maxBusynessDetails.spamminess * busynessConfig.spamminessWeight).toFixed(2)).padStart(10)}\n` +
          `Density (D):         ${String(maxBusynessDetails.density.toFixed(2)).padStart(10)} ${String((-maxBusynessDetails.density * busynessConfig.densityWeight).toFixed(2)).padStart(10)}\n` +
          '```',
      },
    )
    .setColor(Colors.Blurple);

  try {
    await message.edit({ embeds: [embed] });
  } catch {
    log.debug(F, 'Failed to update embed. Embed might have been deleted.');
    return; // Stop the process if the embed cannot be updated
  }

  setTimeout(checkBusyness, interval);
}

export const dBusyness: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('busyness')
    .setDescription('Manage the busyness score of #lounge')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('post')
        .setDescription('Post the busyness embed')
        .addBooleanOption((option) =>
          option
            .setName('ephemeral')
            .setDescription('Set to "True" to show the response only to you'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Update the busyness configuration')
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('The configuration key to update')
            .setRequired(true)
            .addChoices(
              { name: 'Message Weight', value: 'messageWeight' },
              { name: 'User Weight', value: 'userWeight' },
              { name: 'Spamminess Weight', value: 'spamminessWeight' },
              { name: 'Density Weight', value: 'densityWeight' },
              { name: 'Busyness Threshold', value: 'busynessThreshold' },
            ),
        )
        .addNumberOption((option) =>
          option
            .setName('value')
            .setDescription('The new value for the configuration key')
            .setRequired(true),
        ),
    ) as SlashCommandBuilder,
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

      message = await interaction.editReply({
        embeds: [
          embedTemplate()
            .setTitle(embedTitle)
            .setDescription(header)
            .setColor(Colors.Blurple)
            .setFooter(null),
        ],
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
