import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ChannelSelectMenuInteraction,
  ContainerBuilder,
  GuildMember,
  InteractionEditReplyOptions,
  MessageFlags,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  time,
} from 'discord.js';

import { AiButton } from './buttons';
import { AiFunction } from './functions';
import { AiMenu } from './menus';
import { AiPersona, type PersonaId } from './personas';
import { AiText } from './texts';
import { AiInteraction } from './types';

const F = f(__filename); // test

export class AiPage {
  static async info(
    interaction: AiInteraction | ChannelSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const container = new ContainerBuilder()
      .setAccentColor(0xC3A635);

    // 1. Calculate the Midnight CST Reset (UTC-6)
    const now = new Date();
    const dayStart = new Date();
    dayStart.setUTCHours(6, 0, 0, 0);
    if (dayStart > now) dayStart.setUTCDate(dayStart.getUTCDate() - 1);

    // 2. Fetch Global Bot Statistics
    // Using aliasing to avoid ESLint 'no-underscore-dangle'
    const [globalLifetime, globalDaily, totalImages] = await Promise.all([
      db.ai_message.aggregate({
        _sum: { tokens: true, usd: true },
        _count: { id: true },
      }),
      db.ai_message.aggregate({
        _sum: { tokens: true, usd: true },
        _count: { id: true },
        where: { created_at: { gte: dayStart } },
      }),
      db.ai_image.count(),
    ]);

    // Destructure and Alias
    const { _count: lifeCount, _sum: lifeSum } = globalLifetime;
    const { _count: dailyCount, _sum: dailySum } = globalDaily;

    // Calculations
    const totalMsgs = lifeCount.id || 0;
    const totalTokens = lifeSum.tokens || 0;
    const totalUsd = lifeSum.usd || 0;

    const todayMsgs = dailyCount.id || 0;
    const todayTokens = dailySum.tokens || 0;
    const todayUsd = dailySum.usd || 0;

    // 3. Add General Info Text
    AiText.aiInfo.forEach((text, index) => {
      if (index > 0) {
        container.addSeparatorComponents(sep => sep.setDivider(true));
      }
      container.addTextDisplayComponents(td => td.setContent(text));
    });

    // 4. Add the Global Stats Section
    container.addSeparatorComponents(sep => sep.setDivider(true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(stripIndents`
      ## 🌍 Global AI Statistics
      A live look at how the community is using TripBot AI.

      **Last 24 Hours (Since Midnight CST)**
      • Messages Sent: \`${todayMsgs.toLocaleString()}\`
      • Tokens Processed: \`${todayTokens.toLocaleString()}\`
      • Infrastructure Cost: \`$${todayUsd.toFixed(4)}\`

      **Project Lifetime**
      • Total Interactions: \`${(totalMsgs + totalImages).toLocaleString()}\`
      • Total Tokens: \`${totalTokens.toLocaleString()}\`
      • Total AI Investment: \`$${totalUsd.toFixed(2)}\`
      
      *Stats update in real-time. Want to help keep the bot running? Use \`/donate\`!*
    `));

    return {
      components: [
        container,
        await AiFunction.pageMenu(interaction),
      ],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async personas(
    interaction: AiInteraction | ChannelSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const { user, member } = interaction;

    // 1. Fetch Global Usage (Optimized GroupBy)
    // Aliasing to satisfy ESLint no-underscore-dangle
    const personaUsage = await db.ai_message.groupBy({
      by: ['ai_persona_id'],
      _count: { id: true },
    });

    const statsMap = personaUsage.reduce((acc, curr) => {
      const { ai_persona_id: id, _count: stats } = curr;
      acc[id] = stats.id;
      return acc;
    }, {} as Record<string, number>);

    // 2. Fetch User Data for Menu Placeholder
    const userData = await db.users.findUnique({
      where: { discord_id: user.id },
      include: { ai_info: true },
    });
    const currentId = (userData?.ai_info?.persona_id as PersonaId) || 'tripbot';
    const currentPersona = AiPersona.List[currentId] || AiPersona.TripBot;

    const container = new ContainerBuilder()
      .setAccentColor(0x88cc99);

    // 3. Header & Selector
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(stripIndents`
      # 🎭 Persona Gallery
      Select your preferred "vibe" below. Personas change how TripBot thinks and speaks.
    `));

    const isPremium = AiFunction.checkPremiumStatus(member as GuildMember);
    container.addActionRowComponents(ar => ar.addComponents(
      AiMenu.aiPersonasSelect(isPremium)
        .setPlaceholder(`Current: ${currentPersona.emoji} ${currentPersona.name}`),
    ));

    container.addSeparatorComponents(sep => sep.setDivider(true));

    // 4. THE "TABLE" VIEW: Iterate and build rows
    Object.values(AiPersona.List).forEach((persona, index) => {
      if (index > 0) {
        container.addSeparatorComponents(sep => sep.setDivider(true));
      }

      const hasAccess = AiFunction.checkPremiumStatus(member as GuildMember) || persona.id === 'tripbot';

      const usage = statsMap[persona.id] || 0;
      const statusIcon = hasAccess ? '🟢' : '🔒';
      const lockText = hasAccess ? '' : ' *(Locked)*';

      // We use a clean 3-line format to keep the "Table" feel
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(stripIndents`
        **${persona.emoji} ${persona.name}** ${statusIcon}${lockText}
        > ${persona.description}
        \`Vibe: ${persona.config.communicationStyle.tone}\` | \`Usage: ${usage.toLocaleString()}\`
      `));
    });

    return {
      components: [
        container,
        await AiFunction.pageMenu(interaction),
      ],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async guildSettings(
    interaction: AiInteraction | ChannelSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const { guild, member } = interaction;
    if (!guild) return { content: AiText.aiServerError };

    // 1. Fetch Guild Data (Ensure record exists)
    // Aliasing ai_channels to avoid ESLint dangling underscore triggers if needed
    const guildData = await db.discord_guilds.upsert({
      where: { id: guild.id },
      create: { id: guild.id },
      update: {},
      include: {
        ai_channels: true,
      },
    });

    // 2. Permission Check
    // We check if they can manage the guild to see the 'Edit' menu
    const canManage = (member as GuildMember).permissions.has(PermissionFlagsBits.ManageGuild);

    const container = new ContainerBuilder()
      .setAccentColor(0xC3A635);

    // 3. Dynamic Status Text
    // This is visible to EVERYONE
    const enabledChannels = guildData.ai_channels.length > 0
      ? guildData.ai_channels.map(c => `<#${c.channel_id}>`).join(', ')
      : 'None';

    container.addTextDisplayComponents(td => td.setContent(stripIndents`
      # 🔧 AI Guild Channels
      These are the channels where TripBot is currently authorized to respond.
      
      **Currently Enabled:** ${enabledChannels}
      
      ${!canManage ? '*Only server administrators can modify this list.*' : 'Use the menu below to add or remove channels.'}
    `));

    // 4. Conditional Menu Injection
    // Only admins get the 'ActionRow' with the select menu
    if (canManage) {
      const channelMenu = AiMenu.guildChannels;
      if (guildData.ai_channels.length > 0) {
        const defaultChannels = guildData.ai_channels.map(channel => channel.channel_id);
        channelMenu.setDefaultChannels(defaultChannels);
      }
      container.addActionRowComponents(ar => ar.addComponents(channelMenu));
    }

    return {
      components: [
        container,
        await AiFunction.pageMenu(interaction),
      ],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async userSettings(
    interaction: AiInteraction | ModalSubmitInteraction | ChannelSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const { user } = interaction;

    let userData = await db.users.upsert({
      where: { discord_id: user.id },
      create: { discord_id: user.id },
      update: {},
      include: { ai_info: true },
    });

    // 1. Fetch/Init User Data
    if (!userData.ai_info) {
      await db.ai_info.create({
        data: { user_id: userData.id }, // userData.id is the guaranteed UUID
      });

      // Re-fetch to get the included record
      userData = await db.users.findUniqueOrThrow({
        where: { id: userData.id },
        include: { ai_info: true },
      });
    }

    const aiInfo = userData.ai_info;
    if (!aiInfo) {
      log.error(F, `AI Info record missing for ${user.username} (${user.id})`);
      log.error(F, `User Data: ${JSON.stringify(userData)}`);
      throw new Error('AI Info record missing');
    }

    // 2. Setup Time & Tiers
    const now = new Date();
    // Calculate Midnight CST (Central Standard Time is UTC-6)
    // In March 2026, we are in CST. 06:00 UTC = 00:00 CST.
    const resetTime = new Date();
    resetTime.setUTCHours(6, 0, 0, 0);
    if (resetTime <= now) resetTime.setUTCDate(resetTime.getUTCDate() + 1);

    const msUntilReset = resetTime.getTime() - now.getTime();
    const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    // 3. Premium Check
    let isPremium = false;
    const tsGuild = discordClient.guilds.cache.get(env.DISCORD_GUILD_ID);
    const member = tsGuild ? await tsGuild.members.fetch(user.id).catch(() => null) : null;
    if (member) {
      await member.fetch();
      isPremium = AiFunction.checkPremiumStatus(member);
    }

    // Daily Budgets (USD)
    const dailyLimit = isPremium ? AiText.maxDailyCostPremium : AiText.maxDailyCost;

    // 4. Aggregates (Aliasing to avoid ESLint dangling underscore errors)
    const [lifetimeStats, dailyStats, imageCount] = await Promise.all([
      db.ai_message.aggregate({
        _sum: { tokens: true, usd: true },
        _count: { id: true },
        where: { ai_info_id: aiInfo.id },
      }),
      db.ai_message.aggregate({
        _sum: { tokens: true, usd: true },
        _count: { id: true },
        where: {
          ai_info_id: aiInfo.id,
          created_at: { gte: new Date(resetTime.getTime() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.ai_image.count({ where: { ai_info_id: aiInfo.id } }),
    ]);

    // Destructure and Alias
    const { _count: totalCount, _sum: totalSum } = lifetimeStats;
    const { _count: dailyCount, _sum: dailySum } = dailyStats;

    const totalMsgs = totalCount.id || 0;
    const totalTokens = totalSum.tokens || 0;
    const totalUsd = totalSum.usd || 0;
    const todayUsd = dailySum.usd || 0;
    const todayTokens = dailySum.tokens || 0;
    const avgCost = totalMsgs > 0 ? (totalUsd / totalMsgs).toFixed(5) : '0.00000';

    // 5. Build the Progress Bar
    const percentUsed = Math.min((todayUsd / dailyLimit) * 100, 100);
    const barSegments = 10;
    const filledSegments = Math.round((percentUsed / 100) * barSegments);
    const progressBar = '🟩'.repeat(filledSegments) + '⬜'.repeat(barSegments - filledSegments);

    // 6. UI Construction
    const personaId = (aiInfo.persona_id as PersonaId) || 'tripbot';
    const persona = AiPersona.List[personaId] || AiPersona.TripBot;

    const container = new ContainerBuilder()
      .setAccentColor(isPremium ? 0xFFD700 : 0x7289DA); // Gold for Premium, Blurple for Std

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(stripIndents`
        # 🤖 AI User Settings
        Manage your personality and view your resource usage.

        ## 🎭 Current Persona
        Selected: **${persona.emoji} ${persona.name}**
        *${persona.description}*
      `),
    );

    // Persona Selection Menu
    container.addActionRowComponents(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        AiMenu.aiPersonasSelect(isPremium)
          .setPlaceholder(`Switch Persona (Current: ${persona.name})`),
      ),
    );

    container.addSeparatorComponents(s => s.setDivider(true));

    // Stats Section
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(stripIndents`
        ## 📊 Resource Usage
        **Daily Power Level** (${percentUsed.toFixed(1)}%)
        \`${progressBar}\`
        ${todayUsd >= dailyLimit ? '⚠️ *Limit reached. Running on Free Tier.*' : `✅ *$${(dailyLimit - todayUsd).toFixed(4)} credits remaining.*`}

        **Rolling Stats (24h)**
        • Messages Today: \`${dailyCount.id || 0}\`
        • Tokens Today: \`${todayTokens.toLocaleString()}\`
        • Cost Today: \`$${todayUsd.toFixed(4)}\`
        • Reset In: \`${hours}h ${minutes}m\` (Midnight CST)

        **Lifetime Stats**
        • Messages: \`${totalMsgs.toLocaleString()}\`
        • Images: \`${imageCount.toLocaleString()}\`
        • Total Tokens: \`${totalTokens.toLocaleString()}\`
        • Avg. Cost/Msg: \`$${avgCost}\`
      `),
    );

    // 7. Footer/Nav
    return {
      components: [
        container,
        await AiFunction.pageMenu(interaction),
      ],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async tos(
    interaction: AiInteraction | ChannelSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const userData = await db.users.upsert({
      where: { discord_id: interaction.user.id },
      create: { discord_id: interaction.user.id },
      update: {},
      include: {
        ai_info: true,
      },
    });

    // Build the TOS layout
    const container = new ContainerBuilder()
      .setAccentColor(0x9EABC9);

    AiText.aiTermsOfService.forEach((text, index) => {
      if (index > 0) {
        container.addSeparatorComponents(sep => sep.setDivider(true));
      }
      container.addTextDisplayComponents(td => td.setContent(text));
    });

    container.addSeparatorComponents(sep => sep.setDivider(true));
    container.addTextDisplayComponents(td => td.setContent(stripIndents`
      ${userData.ai_info?.ai_tos_agree ? `You agreed to the terms of service ${time(userData.ai_info?.ai_tos_agree)}.` : '*You have not agreed to the terms of service.*'}
    `));

    if (!userData.ai_info?.ai_tos_agree) {
      container.addActionRowComponents(ar => ar.addComponents(AiButton.agreeTos));
    }

    return {
      components: [container, await AiFunction.pageMenu(interaction)],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async privacy(
    interaction: AiInteraction | ChannelSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const userData = await db.users.upsert({
      where: { discord_id: interaction.user.id },
      create: { discord_id: interaction.user.id },
      update: {},
      include: {
        ai_info: true,
      },
    });

    const container = new ContainerBuilder()
      .setAccentColor(0x5BD1E5);

    AiText.aiPrivacyPolicy.forEach((text, index) => {
      if (index > 0) {
        container.addSeparatorComponents(sep => sep.setDivider(true));
      }
      container.addTextDisplayComponents(td => td.setContent(text));
    });

    container.addSeparatorComponents(sep => sep.setDivider(true));
    container.addTextDisplayComponents(td => td.setContent(stripIndents`
      ${userData.ai_info?.ai_privacy_agree ? `You agreed to the privacy policy ${time(userData.ai_info?.ai_privacy_agree)}.` : '*You have not agreed to the privacy policy.*'}
    `));

    if (!userData.ai_info?.ai_privacy_agree) {
      container.addActionRowComponents(ar => ar.addComponents(AiButton.agreePrivacy));
    }

    return {
      components: [container, await AiFunction.pageMenu(interaction)],
      flags: MessageFlags.IsComponentsV2,
    };
  }
}

export default AiPage;
