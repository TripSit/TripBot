import {
  ActionRowBuilder,
  ButtonBuilder,
  InteractionEditReplyOptions,
  ChannelSelectMenuBuilder,
  TextDisplayBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  ContainerBuilder,
  time,
} from 'discord.js';
import { stripIndents } from 'common-tags';

import AiButton from './aiButtons';
import AiFunction from './aiFunctions';
import AiMenu from './aiMenus';
import AiText from './aiTexts';
import {
  AiComponent, AiInteraction, PersonaId,
} from './aiTypes';

export default class AiPage {
  static async info(
    interaction: AiInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const container = new ContainerBuilder()
      .setAccentColor(0xC3A635);

    AiText.aiInfo.forEach(text => {
      container.addSeparatorComponents(sep => sep.setDivider(true));
      container.addTextDisplayComponents(td => td.setContent(text));
    });

    return {
      components: [
        container,
        await AiFunction.pageMenu(interaction),
      ],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async personas(interaction: AiInteraction): Promise<InteractionEditReplyOptions> {
    let selectedPersonaId: PersonaId = 'tripbot';

    if (interaction.customId === AiText.MenuId.PERSONA_INFO) {
      const selectedMenuValue = interaction.values?.[0];
      if (selectedMenuValue && Object.values(['tripbot', 'chill_buddy', 'wise_sage', 'hype_beast', 'sassy_bot']).includes(selectedMenuValue)) {
        selectedPersonaId = selectedMenuValue as PersonaId;
      }
    }

    const persona = AiFunction.getPersonaById(selectedPersonaId);

    const replyComponents: AiComponent[] = [];

    const personaSelectMenu = AiMenu.aiPersonaInfo()
      .setPlaceholder(persona?.name || 'TripBot');

    replyComponents.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(personaSelectMenu),
    );

    // Find the selected persona from the AiPersona class
    const selectedPersona = await AiFunction.getPersonaById(selectedPersonaId);

    if (selectedPersona) {
      const personaInfoContainer = new ContainerBuilder()
        .setAccentColor(0x88cc99);

      // Generate the full personality prompt
      const fullPrompt = AiFunction.generatePersonalityPrompt(selectedPersona);

      // Split prompt into chunks for Discord display (max ~1000 chars each)
      const promptLines = fullPrompt.split('\n');
      const chunks = promptLines.reduce<string[]>((acc, line) => {
        const lastChunk = acc[acc.length - 1] || '';
        if (lastChunk.length + line.length > 1000) {
          acc.push(line);
        } else {
          acc[acc.length - 1] = lastChunk ? `${lastChunk}\n${line}` : line;
        }
        return acc;
      }, ['']);

      // Display each chunk
      chunks.forEach((chunk, index) => {
        const title = index === 0 ? '**Generated Personality Prompt**' : '';
        personaInfoContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${title}\n\`\`\`${chunk}\`\`\``),
        );
      });

      replyComponents.push(personaInfoContainer);
    }

    replyComponents.push(await AiFunction.pageMenu(interaction));

    return {
      components: replyComponents,
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async guildSettings(
    interaction: AiInteraction,
  ): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild) return { content: AiText.aiServerError };

    const guildData = await db.discord_guilds.upsert({
      where: { id: interaction.guild.id },
      create: { id: interaction.guild.id },
      update: {},
      include: {
        ai_channels: true,
      },
    });

    const components: AiComponent[] = [];

    components.push(
      new TextDisplayBuilder().setContent(stripIndents`
          You can enable the AI in the channels/categories you choose below.

          **Currently linked channels:**
        `),
    );

    // If there are guildData.ai_channel, add them to the compents list
    const channelMenu = AiMenu.guildChannels;
    if (guildData.ai_channels.length > 0) {
      const defaultChannels = guildData.ai_channels.map(channel => channel.channel_id);
      channelMenu.setDefaultChannels(defaultChannels);
    }

    components.push(new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(AiMenu.guildChannels));

    components.push(await AiFunction.pageMenu(interaction));
    return {
      components,
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async userSettings(
    interaction: AiInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const userData = await db.users.upsert({
      where: { discord_id: interaction.user.id },
      create: { discord_id: interaction.user.id },
      update: {},
      include: {
        ai_info: true,
      },
    });

    const primaryModelId = userData.ai_info?.primary_model || 'google/gemini-2.5-flash';

    const primaryModelData = AiText.modelInfo.find(model => model.value === primaryModelId);

    const primaryModelLabel = primaryModelData ? `${primaryModelData.emoji} ${primaryModelData.label}` : 'Unknown Model';

    const secondaryModelId = userData.ai_info?.secondary_model || 'google/gemini-2.0-flash-exp:free';

    const secondaryModelData = AiText.modelInfo.find(model => model.value === secondaryModelId);

    const secondaryModelLabel = secondaryModelData ? `${secondaryModelData.emoji} ${secondaryModelData.label}` : 'Unknown Model';

    const persona = AiFunction.getPersonaById(userData.ai_info?.persona_name as PersonaId || 'tripbot');

    return {
      components: [
        new TextDisplayBuilder().setContent(stripIndents`
          When you @ Tripbot it will respond with this persona:
        `),
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            AiMenu.aiPersonasSelect()
              .setPlaceholder(persona?.name || 'TripBot'),
          ),
        new TextDisplayBuilder().setContent(stripIndents`
        When you send messages to the API you will be using this model:
      `),
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            AiMenu.primaryModels()
              .setPlaceholder(primaryModelLabel),
          ),
        new TextDisplayBuilder().setContent(stripIndents`
        When you run out of credits, you will start using this **free** model:
      `),
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            AiMenu.secondaryModels()
              .setPlaceholder(secondaryModelLabel),
          ),
        new TextDisplayBuilder().setContent(stripIndents`
        Your responses are capped at this many tokens. 
        Increase this for more detailed responses, but use credits faster.
      `),
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            AiButton.responseSize.setLabel(`${userData.ai_info?.response_size || 500} tokens`),
          ),
        new TextDisplayBuilder().setContent(stripIndents`
        Your context size is this many tokens: 
        Increase this to include more of your previous messages in the context.
      `),
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            AiButton.contextSize.setLabel(`${userData.ai_info?.context_size || 10000} tokens`),
          ),
        await AiFunction.pageMenu(interaction),
      ],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  static async tos(
    interaction: AiInteraction,
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

    AiText.aiTermsOfService.forEach(text => {
      container.addSeparatorComponents(sep => sep.setDivider(true));
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
    interaction: AiInteraction,
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

    AiText.aiPrivacyPolicy.forEach(text => {
      container.addSeparatorComponents(sep => sep.setDivider(true));
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
