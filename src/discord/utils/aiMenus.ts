import {
  ChannelSelectMenuBuilder, ChannelType, StringSelectMenuBuilder,
} from 'discord.js';
import AiPersona from './aiPersonas';
import { PersonaSpec } from './aiTypes';
import AiText from './aiTexts';

export default class AiMenu {
  static readonly guildChannels = new ChannelSelectMenuBuilder()
    .setCustomId(AiText.MenuId.GUILD_CHANNELS)
    .setPlaceholder('Select channels that will allow AI responses')
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildCategory)
    .setMinValues(0) // Allow no channels to be selected, to remove ai from the guild
    .setMaxValues(10);

  static aiPersonaInfo(): StringSelectMenuBuilder {
    // Get all static properties that are PersonaSpecs
    const personaEntries = Object.getOwnPropertyNames(AiPersona)
      .map(key => ({ key, value: (AiPersona as any)[key] }))
      .filter(({ value }) => value && typeof value === 'object' && value.id && value.name && value.config)
      .map(({ value }) => value as PersonaSpec);

    return new StringSelectMenuBuilder()
      .setCustomId(AiText.MenuId.PERSONA_INFO)
      .setPlaceholder('Please select a persona to view.')
      .addOptions(
        personaEntries.map(persona => ({
          label: persona.name,
          value: persona.id,
        })),
      );
  }

  static aiPersonasSelect(): StringSelectMenuBuilder {
    // Get all static properties that are PersonaSpecs
    const personaEntries = Object.getOwnPropertyNames(AiPersona)
      .map(key => ({ key, value: (AiPersona as any)[key] }))
      .filter(({ value }) => value && typeof value === 'object' && value.id && value.name && value.config)
      .map(({ value }) => value as PersonaSpec);
    return new StringSelectMenuBuilder()
      .setCustomId(AiText.MenuId.PERSONA_SELECT)
      .setPlaceholder('Please select a persona to use.')
      .addOptions(
        personaEntries.map((persona: PersonaSpec) => ({
          label: persona.name,
          value: persona.id,
        })),
      );
  }

  static primaryModels(): StringSelectMenuBuilder {
    return new StringSelectMenuBuilder()
      .setCustomId(AiText.MenuId.MODEL_SELECT_PRIMARY)
      .addOptions(
        AiText.modelInfo.map(model => ({
          label: model.label,
          value: model.value,
          description: model.description,
          emoji: model.emoji,
        })),
      )
      .setPlaceholder('Please select a model to use.');
  }

  static secondaryModels(): StringSelectMenuBuilder {
    return new StringSelectMenuBuilder()
      .setCustomId(AiText.MenuId.MODEL_SELECT_SECONDARY)
      .addOptions(
        // Only add models with :free in the model value
        AiText.modelInfo.filter(model => model.value.includes(':free')).map(model => ({
          label: model.label,
          value: model.value,
          description: model.description,
          emoji: model.emoji,
        })),
      )
      .setPlaceholder('Please select a model to use.');
  }

  static pageSelect(): StringSelectMenuBuilder {
    return new StringSelectMenuBuilder()
      .setCustomId(AiText.MenuId.PAGE_SELECT)
      .setPlaceholder('Select a Page!')
      .addOptions(
        Object.values(AiText.Page).map(page => ({
          label: page.label,
          value: page.value,
          description: page.description,
          emoji: page.emoji,
        })),
      );
  }
}
