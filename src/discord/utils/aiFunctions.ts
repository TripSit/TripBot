import {
  ActionRowBuilder,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ComponentType,
  ContainerBuilder,
  Message,
  MessageActionRowComponent,
  MessageFlags,
  StringSelectMenuInteraction,
  TextChannel,
  TextDisplayBuilder,
  StringSelectMenuBuilder,
  User,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { LanguageModelV2Prompt, OpenRouterUsageAccounting } from '@openrouter/ai-sdk-provider';
import AiText from './aiTexts';
import AiMenu from './aiMenus';
import {
  AiInteraction, PersonaName, PersonaSpec, PersonaId,
} from './aiTypes';
import { getDrugInfo } from '../commands/global/d.drug';
import AiPersona from './aiPersonas';

const F = f(__filename);

export default class AiFunction {
  static getComponentById(
    interaction: ButtonInteraction | StringSelectMenuInteraction | ChannelSelectMenuInteraction,
    id: string,
  ):MessageActionRowComponent | null {
    // This function will take an interaction and a customId and return the component with that customId
    // If no component is found, it will return null
    // This is useful for finding the button that was clicked, or select menu that was used

    // Intentionally left without verbose debug logs to keep noise low

    // eslint-disable-next-line no-restricted-syntax
    for (const row of interaction.message.components) {
      if (row.type === ComponentType.ActionRow && 'components' in row) {
        // eslint-disable-next-line no-restricted-syntax
        for (const component of row.components) {
          if ('customId' in component && component.customId?.includes(id)) {
            return component;
          }
        }
      }
    }

    // Return null if no component with the customId is found
    return null;
  }

  static async getPersonaByName(personaName: PersonaName): Promise<PersonaSpec | undefined> {
    return AiPersona[personaName as keyof typeof AiPersona] as PersonaSpec;
  }

  static getPersonaById(personaId: PersonaId): PersonaSpec | undefined {
    log.debug(F, `Looking up persona by ID: ${personaId}`);

    log.debug(F, `Properties: ${Object.getOwnPropertyNames(AiPersona)}`);
    return Object.getOwnPropertyNames(AiPersona)
      .map(key => (AiPersona as any)[key])
      .find(value => value && typeof value === 'object' && value.id === personaId) as PersonaSpec | undefined;
  }

  static async aiAudit(
    user: User,
    message: Message,
    prompt: LanguageModelV2Prompt,
    chatResponse: { content: string; reasoning: string | undefined; usage: OpenRouterUsageAccounting | undefined; },
    modelUsed: string,
  ) {
    // This function takes what was sent and returned from the API and sends it to a discord channel
    // for review. This is to ensure that the AI is not being used to break the rules.

    // Audit message formatter

    const promptMessage = message;
    const contextMessages = prompt.slice(0, prompt.length - 1);

    // Look up user + ai_info to compute persona, rolling cost, and total messages
    const userRecord = await db.users.findUnique({
      where: { discord_id: user.id },
      include: { ai_info: true },
    });

    const personaName = userRecord?.ai_info?.persona_id || 'tripbot';
    const aiInfoId = userRecord?.ai_info?.id || null;

    let rollingUsd = 0;
    let totalMessages = 0;
    if (aiInfoId) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const agg = await db.ai_message.aggregate({
        _sum: { usd: true },
        where: { ai_info_id: aiInfoId, created_at: { gte: since } },
      });
      // eslint-disable-next-line no-underscore-dangle
      rollingUsd = agg._sum.usd ?? 0;
      totalMessages = await db.ai_message.count({ where: { ai_info_id: aiInfoId } });
    }

    const modelInfo = AiText.modelInfo.find(m => m.value === modelUsed);
    const modelLabel = modelInfo ? `${modelInfo.emoji} ${modelInfo.label}` : modelUsed;

    const promptTokens = chatResponse.usage?.promptTokens ?? 0;
    const completionTokens = chatResponse.usage?.completionTokens ?? 0;
    const totalUsd = chatResponse.usage?.cost ?? 0;

    const contextMessageOutput = contextMessages
      .map(messageData => `${messageData.content}`)
      .join('\n')
      .slice(0, 1900);

    const promptOutput = `${promptMessage.url} ${promptMessage.member?.displayName}: ${promptMessage.cleanContent}`
      .slice(0, 1900);

    const resultOutput = chatResponse.content.slice(0, 1900);

    const container = new ContainerBuilder().setAccentColor(0xE5C07B);

    // Header / summary
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(stripIndents`
      AI Audit — ${promptMessage.member?.displayName} (${promptMessage.author.id})
      Persona: ${personaName}
      Model: ${modelLabel}
      Prompt Tokens: ${promptTokens}
      Completion Tokens: ${completionTokens}
      Cost (USD): $${totalUsd.toFixed(4)}
      24h Rolling Usage (USD): $${rollingUsd.toFixed(4)}
      Total Messages Sent: ${totalMessages}
    `));

    container.addSeparatorComponents(sep => sep.setDivider(true));

    container.addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`Context:\n${contextMessageOutput || 'No context'}`),
    );

    container.addSeparatorComponents(sep => sep.setDivider(true));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Prompt:\n${promptOutput}`),
    );

    container.addSeparatorComponents(sep => sep.setDivider(true));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Result:\n${resultOutput}`),
    );

    // Send using Component System v2
    const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
    await channelAiLog.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }

  static async pageMenu(
    interaction: AiInteraction,
  ):Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const pages = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(AiMenu.pageSelect());

    let buttonId: keyof typeof AiText.ButtonId | keyof typeof AiText.AiSubcommand | keyof typeof AiText.MenuId;
    if (interaction.isButton()) {
      buttonId = interaction.customId as keyof typeof AiText.ButtonId;
    } else if (interaction.isChatInputCommand()) {
      buttonId = interaction.options.getSubcommand() as keyof typeof AiText.AiSubcommand;
    } else if (interaction.isChannelSelectMenu()) {
      buttonId = interaction.customId as keyof typeof AiText.MenuId;
    } else if (interaction.isStringSelectMenu()) {
      buttonId = interaction.customId as keyof typeof AiText.MenuId;
    } else {
      buttonId = AiText.AiSubcommand.INFO as keyof typeof AiText.AiSubcommand;
    }

    switch (buttonId) {
      case AiText.AiSubcommand.INFO:
        pages.components[0].setPlaceholder('Info');
        break;
      case AiText.AiSubcommand.PERSONAS:
      case AiText.MenuId.PERSONA_INFO:
        pages.components[0].setPlaceholder('Personas');
        break;
      case AiText.AiSubcommand.SETUP:
      case AiText.MenuId.GUILD_CHANNELS:
        pages.components[0].setPlaceholder('Setup');
        break;
      case AiText.AiSubcommand.SETTINGS:
      case AiText.MenuId.PERSONA_SELECT:
      case AiText.MenuId.MODEL_SELECT_PRIMARY:
      case AiText.MenuId.MODEL_SELECT_SECONDARY:
      case AiText.ButtonId.CONTEXT_SIZE:
      case AiText.ButtonId.RESPONSE_SIZE:
        pages.components[0].setPlaceholder('Settings');
        break;
      case AiText.AiSubcommand.PRIVACY:
        pages.components[0].setPlaceholder('Privacy Policy');
        break;
      case AiText.AiSubcommand.TOS:
        pages.components[0].setPlaceholder('Terms of Service');
        break;
      case AiText.MenuId.PAGE_SELECT: {
        const pageData = Object.values(AiText.Page).find(page => page.value === interaction.values[0]);
        if (pageData) {
          pages.components[0].setPlaceholder(
            `${pageData.emoji} ${pageData.label}`,
          );
        }
        break;
      }
      default:
        pages.components[0].setPlaceholder('Select a Page');
    }

    return pages;
  }

  static async createPrompt(message: Message, personaId: PersonaId): Promise<LanguageModelV2Prompt> {
    const messageList:LanguageModelV2Prompt = [];

    const botNickname = message.guild?.members.me?.nickname || '';

    // Get a list of messages
    const messageHistory = await message.channel.messages.fetch();

    // Loop over each message and remove the bot's nickname from the content
    await Promise.all(messageHistory.map(async messageData => {
      if (messageData.author.id === discordClient.user?.id) {
        messageList.push({
          role: 'assistant',
          content: [{ type: 'text', text: messageData.cleanContent }],
        });
      } else if (messageData.cleanContent.includes(botNickname)) {
        const contentWithoutMention = messageData.cleanContent.replace(`@${botNickname}`, '').trim();
        messageList.push({
          role: 'user',
          content: [{ type: 'text', text: contentWithoutMention }],
        });
      }
    }));
    messageList.push({
      role: 'system',
      content: AiText.objectiveTruths,
    });

    const selectedPersona = await AiFunction.getPersonaById(personaId);
    if (!selectedPersona) {
      throw new Error(`Persona ${personaId} not found`);
    }
    messageList.push({
      role: 'system',
      content: AiFunction.generatePersonalityPrompt(selectedPersona),
    });
    messageList.reverse();

    log.debug(F, `messageList: ${JSON.stringify(messageList, null, 2)}`);

    const attachmentInfo = {
      url: null,
      mimeType: null,
    } as {
      url: string | null;
      mimeType: string | null;
    };

    if (message.attachments && message.attachments.size >= 1) {
      attachmentInfo.url = message.attachments.first()?.url as string;
      attachmentInfo.mimeType = message.attachments.first()
        ?.contentType as string;
    }

    if (message.reference) {
      const refMessage = await message.fetchReference();
      attachmentInfo.url = refMessage.attachments.first()?.url as string;
      attachmentInfo.mimeType = refMessage.attachments.first()
        ?.contentType as string;
    }
    return messageList;
  }

  static readonly availableFunctions = {
    getDrugInfo,
  };

  static readonly aiFunctions = [
    {
      type: 'function',
      function: {
        name: 'getDrugInfo',
        description: 'Get information on a drug or substance, such as dosages or summary',
        parameters: {
          type: 'object',
          properties: {
            drugName: { type: 'string', description: 'The name of the substance to look up' },
            section: { type: 'string', description: 'The section to return' },
          },
          required: ['drugName'],
        },
      },
    },
  ];

  static generatePersonalityPrompt(persona: PersonaSpec): string {
    const lines: string[] = [];
    const { config } = persona;

    // Identity and core description
    lines.push(`You are ${persona.name}. ${persona.description}`);

    // Communication style summary
    const styleElements = [
      config.communicationStyle.formality,
      `${config.communicationStyle.verbosity} responses`,
      `${config.communicationStyle.tone} tone`,
    ];
    lines.push(`Communication style: ${styleElements.join(', ')}.`);

    // Language and expression profile
    const languageElements = [];
    if (config.language.emojiFrequency !== 'none') {
      languageElements.push(`${config.language.emojiFrequency} ${config.language.emojiStyle} emojis`);
    }
    if (config.language.slangUsage !== 'none') {
      languageElements.push(`${config.language.slangUsage} slang`);
    }
    if (config.language.profanityLevel !== 'none') {
      languageElements.push(`${config.language.profanityLevel} profanity allowed`);
    }
    languageElements.push(`${config.language.punctuationStyle} punctuation`);

    if (languageElements.length > 0) {
      lines.push(`Language style: ${languageElements.join(', ')}.`);
    }

    // Personality traits
    const personalityElements = [];
    if (config.personality.humor !== 'none') {
      personalityElements.push(`${config.personality.humor} humor`);
    }
    personalityElements.push(`${config.personality.confidence} confidence`);
    personalityElements.push(`${config.personality.empathy} empathy`);
    if (config.personality.sarcasm !== 'none') {
      personalityElements.push(`${config.personality.sarcasm} sarcasm`);
    }
    lines.push(`Personality: ${personalityElements.join(', ')}.`);

    // Generate specific behavioral instructions
    lines.push(''); // Empty line for readability
    lines.push('Behavioral guidelines:');

    // Communication style instructions
    const formalityInstructions = {
      very_formal: 'Use extremely formal language, proper titles, and professional terminology at all times.',
      formal: 'Maintain proper grammar and professional language throughout all interactions.',
      neutral: 'Use standard conversational English with correct grammar and balanced tone.',
      casual: 'Speak naturally and relaxed, like chatting with a friend - contractions are fine.',
      very_casual: 'Be super casual - use contractions, informal language, and text-speak naturally.',
    };
    lines.push(`- ${formalityInstructions[config.communicationStyle.formality]}`);

    const verbosityInstructions = {
      very_brief: 'Keep all responses to a few words maximum. Be extremely concise.',
      brief: 'Give concise, to-the-point responses without unnecessary detail, 2-3 sentences max.',
      moderate: 'Provide balanced responses with appropriate detail - not too short or long. 4-6 sentences max, a paragraph.',
      detailed: 'Give thorough, comprehensive responses with explanations and context. Multiple paragraphs.',
      very_detailed: 'Be extremely thorough with extensive explanations, examples, and background context. Multiple paragraphs.',
    };
    lines.push(`- ${verbosityInstructions[config.communicationStyle.verbosity]}`);

    // Tone-specific instructions
    const toneInstructions = {
      serious: 'Maintain a serious, professional demeanor. Avoid jokes or casual remarks.',
      neutral: 'Keep an even, balanced emotional tone without being overly friendly or cold.',
      friendly: 'Be warm, approachable, and welcoming. Show genuine care for the user.',
      playful: 'Be fun, lighthearted, and enjoy the conversation. Don\'t be afraid to be silly.',
      sarcastic: 'Use wit, irony, and sarcasm as your primary communication style.',
      enthusiastic: 'Show genuine excitement and energy about topics and interactions!',
    };
    lines.push(`- ${toneInstructions[config.communicationStyle.tone]}`);

    // Language-specific instructions
    if (config.language.emojiFrequency !== 'none') {
      const emojiInstructions = {
        rare: 'Use 1-2 emojis occasionally when they truly enhance the message.',
        occasional: 'Include emojis regularly to express emotions and reactions.',
        frequent: 'Use multiple emojis per response to make messages more expressive.',
        excessive: 'Use lots of emojis! Make your messages colorful and fun! 🎉✨',
      };

      const emojiStyleInstructions = {
        standard: 'Use common, widely-recognized emojis like 😊 👍 ❤️.',
        cute: 'Prefer cute, adorable emojis like 🥺 🌸 ✨ 💕.',
        cool: 'Use cool, trendy emojis like 😎 🔥 💯 ⚡.',
        random: 'Mix different types of emojis unpredictably for variety.',
        thematic: 'Choose emojis that match the topic being discussed.',
        kaomoji: 'Use text-based emoticons like (╯°□°)╯ ¯\\_(ツ)_/¯ (´• ω •`) instead of standard emojis.',
      };

      lines.push(`- ${emojiInstructions[config.language.emojiFrequency]}`);
      lines.push(`- ${emojiStyleInstructions[config.language.emojiStyle]}`);
    }

    if (config.language.slangUsage !== 'none') {
      const slangInstructions = {
        minimal: 'Use occasional internet slang when it feels natural (like "lol", "tbh").',
        moderate: 'Include modern slang, abbreviations, and internet terminology regularly.',
        heavy: 'Use current slang, memes, and internet speak frequently - stay trendy.',
        generational: 'Adapt your slang to current trends and generational language patterns dynamically.',
      };
      lines.push(`- ${slangInstructions[config.language.slangUsage]}`);
    }

    if (config.language.profanityLevel !== 'none') {
      const profanityInstructions = {
        mild: 'Mild profanity is acceptable when it fits naturally (damn, hell, etc.).',
        moderate: 'Use moderate profanity for emphasis when appropriate.',
        heavy: 'Strong profanity is fine to use when it adds to expression or emphasis.',
      };
      lines.push(`- ${profanityInstructions[config.language.profanityLevel]}`);
    }

    const punctuationInstructions = {
      minimal: 'Use standard punctuation only. Avoid exclamation points unless necessary.',
      standard: 'Use normal punctuation patterns with occasional emphasis.',
      expressive: 'Use punctuation expressively! Add emphasis with multiple punctuation marks when excited???',
      chaotic: 'Go wild with punctuation!!! Mix it up??? Use ellipses... and multiple marks for effect!!!',
    };
    lines.push(`- ${punctuationInstructions[config.language.punctuationStyle]}`);

    // Personality-specific instructions
    if (config.personality.humor !== 'none') {
      const humorInstructions = {
        dry: 'Use deadpan, understated humor with subtle wit and understatement.',
        witty: 'Be clever and quick with wordplay, puns, and intelligent humor.',
        silly: 'Use goofy, lighthearted, and playful humor. Don\'t be afraid to be ridiculous.',
        dark: 'Dark humor is acceptable when contextually appropriate and not harmful.',
        absurd: 'Use random, unexpected, and surreal humor that catches people off guard.',
      };
      lines.push(`- ${humorInstructions[config.personality.humor]}`);
    }

    const confidenceInstructions = {
      uncertain: 'Express doubt and uncertainty frequently. Hedge statements with "I think", "maybe", "possibly".',
      modest: 'Be humble and understated about knowledge and opinions. Acknowledge limitations.',
      balanced: 'Show appropriate confidence while acknowledging when you\'re unsure.',
      confident: 'Speak with authority and conviction about topics you know.',
      cocky: 'Be bold, assertive, and self-assured. Don\'t hesitate to show off knowledge.',
    };
    lines.push(`- ${confidenceInstructions[config.personality.confidence]}`);

    const empathyInstructions = {
      low: 'Focus on facts and information rather than emotional support.',
      moderate: 'Show reasonable concern for users but maintain some emotional distance.',
      high: 'Be emotionally supportive, understanding, and caring about user feelings.',
      excessive: 'Be extremely empathetic, almost overwhelmingly caring and emotionally invested.',
    };
    lines.push(`- ${empathyInstructions[config.personality.empathy]}`);

    if (config.personality.sarcasm !== 'none') {
      const sarcasmInstructions = {
        subtle: 'Use light, gentle sarcasm occasionally. Keep it playful rather than cutting.',
        moderate: 'Sarcasm is a regular part of your personality. Use it for humor and emphasis.',
        heavy: 'Be quite sarcastic and ironic in your responses. It\'s your default mode of expression.',
      };
      lines.push(`- ${sarcasmInstructions[config.personality.sarcasm]}`);
    }

    // Safety and boundaries
    lines.push('');
    lines.push('Important boundaries:');
    lines.push('- Never provide medical advice, diagnose conditions, or suggest treatments.');
    lines.push('- Always direct health-related questions to appropriate medical professionals.');
    lines.push('- If unsure about factual information, admit uncertainty rather than guessing.');
    lines.push('- Stay in character while remaining helpful, accurate, and safe.');
    lines.push('- Remember you\'re a Discord bot - keep responses appropriate for the platform.');

    return lines.join('\n');
  }

  // Compact version for token efficiency
  static generateCompactPersonalityPrompt(persona: PersonaSpec): string {
    const { config } = persona;
    const elements: string[] = [];

    // Core identity
    elements.push(`You are ${persona.name}: ${persona.description}.`);

    // Communication style
    elements.push(`Style: ${config.communicationStyle.formality}, ${config.communicationStyle.verbosity}, ${config.communicationStyle.tone}.`);

    // Language preferences
    const langElements = [];
    if (config.language.emojiFrequency !== 'none') {
      langElements.push(`${config.language.emojiFrequency} ${config.language.emojiStyle} emojis`);
    }
    if (config.language.slangUsage !== 'none') {
      langElements.push(`${config.language.slangUsage} slang`);
    }
    if (config.language.profanityLevel !== 'none') {
      langElements.push(`${config.language.profanityLevel} profanity OK`);
    }
    langElements.push(`${config.language.punctuationStyle} punctuation`);
    elements.push(`Language: ${langElements.join(', ')}.`);

    // Personality traits
    const personalityElements = [];
    if (config.personality.humor !== 'none') {
      personalityElements.push(`${config.personality.humor} humor`);
    }
    personalityElements.push(`${config.personality.confidence} confidence`);
    personalityElements.push(`${config.personality.empathy} empathy`);
    if (config.personality.sarcasm !== 'none') {
      personalityElements.push(`${config.personality.sarcasm} sarcasm`);
    }
    elements.push(`Personality: ${personalityElements.join(', ')}.`);

    // Essential safety note
    elements.push('Never give medical advice. Stay in character but be helpful and accurate.');

    return elements.join(' ');
  }

  static getModelInfo(modelId: string): { display: string; emoji: string; label: string } {
    const modelData = AiText.modelInfo.find(model => model.value === modelId);
    return {
      display: modelData ? `${modelData.emoji} ${modelData.label}` : '❓ Unknown Model',
      emoji: modelData?.emoji || '❓',
      label: modelData?.label || 'Unknown Model',
    };
  }
}
