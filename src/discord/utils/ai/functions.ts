import { LanguageModelV3Prompt, OpenRouterUsageAccounting } from '@openrouter/ai-sdk-provider';
import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Collection,
  ComponentType,
  ContainerBuilder,
  GuildMember,
  Message,
  MessageActionRowComponent,
  MessageFlags,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextDisplayBuilder,
  User,
} from 'discord.js';
import { getDrugInfo } from '../../commands/global/d.drug';
import { AiMenu } from './menus';
import { AiPersona, PersonaId } from './personas';
import { AiText } from './texts';
import {
  AiInteraction,
  PersonaName,
  PersonaSpec,
} from './types';

const F = f(__filename); // eslint-disable-line

export class AiFunction {
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

  static getPersonaByName(personaName: PersonaName): PersonaSpec | undefined {
    return AiPersona[personaName as keyof typeof AiPersona] as PersonaSpec;
  }

  static async aiAudit(
    user: User,
    message: Message,
    prompt: LanguageModelV3Prompt,
    chatResponse: { content: string; reasoning: string | undefined; usage: OpenRouterUsageAccounting | undefined; },
    modelUsed: string,
  ) {
    const userRecord = await db.users.findUnique({
      where: { discord_id: user.id },
      include: {
        ai_info: {
          include: {
            _count: { select: { ai_messages: true } }, // Get lifetime count here
          },
        },
      },
    });

    const personaId = userRecord?.ai_info?.persona_id || 'tripbot';
    const aiInfoId = userRecord?.ai_info?.id || null;

    let rollingUsd = 0;
    const totalMessages = userRecord?.ai_info?._count.ai_messages || 0; // eslint-disable-line

    if (aiInfoId) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const agg = await db.ai_message.aggregate({
        _sum: { usd: true },
        where: { ai_info_id: aiInfoId, created_at: { gte: since } },
      });

      const { _sum: rollingSum } = agg;
      rollingUsd = (rollingSum.usd ?? 0) + (chatResponse.usage?.cost || 0);
    }

    // 1. FIXED: Handle the 'object object' bug by extracting text parts properly
    const conversationContext = prompt
      .filter(p => p.role !== 'system')
      .map(p => {
        // Determine the label based on the SDK role
        const roleLabel = p.role === 'user' ? 'User' : 'AI';
        let textContent = '';

        if (typeof p.content === 'string') {
          textContent = p.content;
        } else if (Array.isArray(p.content)) {
          textContent = p.content
            .map(part => ('text' in part ? part.text : ''))
            .join(' ');
        }

        // RUTHLESS SCRUB: Remove any existing "AI:", "User:", or "Assistant:"
        // at the start of the string to prevent doubling.
        const cleanText = textContent.replace(/^(AI|User|Assistant):\s*/gi, '').trim();

        return `**${roleLabel}:** ${cleanText.slice(0, 500)}`;
      })
      .join('\n')
      .slice(0, 1500);

    const container = new ContainerBuilder().setAccentColor(0xE5C07B);

    // 2. High-Value Metadata Header (Now with Guild Info)
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(stripIndents`
      # 🛡️ AI Audit: ${user.tag}
      **Guild:** \`${message.guild?.name || 'DMs'}\` (\`${message.guildId || 'N/A'}\`)
      **Channel:** <#${message.channelId}> | **User ID:** \`${user.id}\`
      **Model:** \`${modelUsed}\` | **Persona:** \`${personaId}\`
      
      **Tokens:** \`${chatResponse.usage?.promptTokens || 0}\` in / \`${chatResponse.usage?.completionTokens || 0}\` out
      **Cost:** \`$${(chatResponse.usage?.cost || 0).toFixed(5)}\` (${aiInfoId ? `$${rollingUsd.toFixed(4)} last 24h` : 'N/A'} )
      **Lifetime Msgs:** \`${aiInfoId ? totalMessages.toLocaleString() : 'N/A'}\`
    `));

    container.addSeparatorComponents(sep => sep.setDivider(true));

    // 3. Conversation Context (Filtered and Formatted)
    if (conversationContext) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(stripIndents`
        ### 🗨️ Conversation Context
        ${conversationContext}
      `));
      container.addSeparatorComponents(sep => sep.setDivider(true));
    }

    // 4. The Final Prompt and Result
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(stripIndents`
      ### 📥 User Input
      > ${message.cleanContent.slice(0, 1000)}
      [Jump to Message](${message.url})

      ### 📤 AI Response
      ${chatResponse.content.slice(0, 1500)}
    `));

    // Log to Discord
    const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG);
    if (!channelAiLog || !channelAiLog.isSendable()) throw new Error('AI log channel is not a text channel');
    await channelAiLog.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  static async pageMenu(
    interaction: AiInteraction | ChannelSelectMenuInteraction | ModalSubmitInteraction,
  ):Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const pages = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(AiMenu.pageSelect());

    let buttonId: keyof typeof AiText.ButtonId | keyof typeof AiText.AiSubcommand | keyof typeof AiText.MenuId;
    if (interaction.isButton()) {
      buttonId = interaction.customId as keyof typeof AiText.ButtonId;
    } else if (interaction.isChatInputCommand()) {
      buttonId = interaction.options.getSubcommand() as keyof typeof AiText.AiSubcommand;
    } else if (interaction.isStringSelectMenu()) {
      buttonId = interaction.customId as keyof typeof AiText.MenuId;
    } else if (interaction.isChannelSelectMenu()) {
      buttonId = interaction.customId as keyof typeof AiText.MenuId;
    } else {
      buttonId = AiText.AiSubcommand.INFO as keyof typeof AiText.AiSubcommand;
    }

    switch (buttonId) {
      case AiText.AiSubcommand.INFO:
        pages.components[0].setPlaceholder(`${AiText.Page.INFO.emoji} ${AiText.Page.INFO.label}`);
        break;
      case AiText.AiSubcommand.PERSONAS:
      case AiText.MenuId.PERSONA_INFO:
        pages.components[0].setPlaceholder(`${AiText.Page.PERSONAS.emoji} ${AiText.Page.PERSONAS.label}`);
        break;
      case AiText.AiSubcommand.SETUP:
      case AiText.MenuId.GUILD_CHANNELS:
        pages.components[0].setPlaceholder(`${AiText.Page.GUILD_SETUP.emoji} ${AiText.Page.GUILD_SETUP.label}`);
        break;
      case AiText.AiSubcommand.SETTINGS:
      case AiText.MenuId.PERSONA_SELECT:
        pages.components[0].setPlaceholder(`${AiText.Page.USER_SETTINGS.emoji} ${AiText.Page.USER_SETTINGS.label}`);
        break;
      case AiText.AiSubcommand.PRIVACY:
        pages.components[0].setPlaceholder(`${AiText.Page.PRIVACY.emoji} ${AiText.Page.PRIVACY.label}`);
        break;
      case AiText.AiSubcommand.TOS:
        pages.components[0].setPlaceholder(`${AiText.Page.TOS.emoji} ${AiText.Page.TOS.label}`);
        break;
      case AiText.MenuId.PAGE_SELECT: {
        const pageData = Object.values(AiText.Page).find(page => page.value === (interaction as StringSelectMenuInteraction).values[0]);
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

  static async createPrompt(message: Message, personaId: PersonaId): Promise<LanguageModelV3Prompt> {
    const messageList: LanguageModelV3Prompt = [];
    const botNickname = message.guild?.members.me?.nickname || 'TripBot';

    // Limit history to 10 messages to save tokens
    const fetchedMessages = await message.channel.messages.fetch({ limit: 10 });

    log.debug(F, `Fetched ${fetchedMessages.size} messages from channel ${message.channelId} for prompt construction`);

    // Sort chronologically (fetch returns newest first)
    const sortedMessages = [...fetchedMessages.values()].reverse();

    sortedMessages.forEach(msg => {
      if (msg.author.id === discordClient.user?.id) {
        messageList.push({
          role: 'assistant',
          content: [{ type: 'text', text: msg.cleanContent }],
        });
      } else if (msg.mentions.has(discordClient.user!) || msg.cleanContent.toLowerCase().includes('tripbot')) {
        // Strip the mention/name to keep the prompt clean
        const content = msg.cleanContent.replace(new RegExp(`@?${botNickname}`, 'gi'), '').trim();
        messageList.push({
          role: 'user',
          content: [{ type: 'text', text: content }],
        });
      }
    });

    log.debug(F, `Constructed message list with ${messageList.length} messages before adding system prompts for persona ${personaId}`);

    const staffList = await this.getStaffList();

    log.debug(F, `Fetched staff list for identity injection: ${staffList}`);

    // Identity Injection
    messageList.unshift({ role: 'system', content: AiText.objectiveTruths(staffList) });

    const selectedPersona = AiPersona.List[personaId];
    if (selectedPersona) {
      // Use COMPACT prompt to save significant token costs
      messageList.unshift({
        role: 'system',
        content: this.generateCompactPersonalityPrompt(selectedPersona),
      });
    }

    log.debug(F, `Constructed prompt with ${messageList.length} messages for persona ${personaId}`);
    log.debug(F, `Prompt content: ${JSON.stringify(messageList, null, 2)}`);

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
      deadpan: 'Use dry, deadpan humor and a flat tone. Be serious on the surface but with subtle wit underneath.',
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

  static checkPremiumStatus(member: GuildMember): boolean {
    const premiumRoles = [env.ROLE_PATREON, env.ROLE_BOOSTER, env.ROLE_PREMIUM, env.ROLE_TEAMTRIPSIT];
    return premiumRoles.some(role => member?.roles.cache.has(role));
  }

  static async getStaffList(): Promise<string> {
    const staffRoles = [
      { label: 'TRIPSITTER', id: env.ROLE_TRIPSITTER },
      { label: 'MODERATOR', id: env.ROLE_MODERATOR },
      { label: 'DEVELOPER', id: env.ROLE_DEVELOPER },
    ];

    // Fetch ALL members from the guild
    const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    const allMembers: Collection<string, GuildMember> = await guild.members.fetch();

    const categorizedStaff: {
      label: string;
      members: string[];
    }[] = [];

    staffRoles.forEach(roleDef => {
      const membersWithRole: string[] = [];

      allMembers.forEach(member => {
        if (member.roles.cache.has(roleDef.id)) {
          membersWithRole.push(member.user.username);
        }
      });

      categorizedStaff.push({
        label: roleDef.label,
        members: membersWithRole.length > 0 ? membersWithRole : ['None'],
      });
    });

    // Format categorized staff into a string
    return categorizedStaff
      .map(category => `**${category.label}:** ${category.members.join(', ')}`)
      .join('\n');
  }
}

export default AiFunction;
