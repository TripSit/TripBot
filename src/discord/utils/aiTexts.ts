import { stripIndents } from 'common-tags';

export default class AiText {
  static readonly maxTokens = 100000;

  static readonly Page: {
    [key: string]: {
      label: string;
      value: string;
      description: string;
      emoji: string;
    };
  } = {
      INFO: {
        label: 'AI Module Info',
        value: 'info',
        description: 'Info on the AI module.',
        emoji: '🤖',
      },
      PERSONAS: {
        label: 'AI Persona Info',
        value: 'personas',
        description: 'Personas for the AI module.',
        emoji: '👤',
      },
      GUILD_SETUP: {
        label: 'Guild Setup',
        value: 'guildSettings',
        description: 'Guild Settings for the AI module.',
        emoji: '🔧',
      },
      USER_SETTINGS: {
        label: 'User Settings',
        value: 'userSettings',
        description: 'User Settings for the AI module.',
        emoji: '🔧',
      },
      PRIVACY: {
        label: 'Privacy Policy',
        value: 'privacy',
        description: 'Privacy Policy for the AI module.',
        emoji: '🔒',
      },
      TOS: {
        label: 'Terms of Service',
        value: 'tos',
        description: 'Terms of Service for the AI module.',
        emoji: '🔒',
      },
    };

  static readonly MenuId = {
    GUILD_CHANNELS: 'AI~guildChannels',
    PERSONA_INFO: 'AI~personaInfo',
    PERSONA_SELECT: 'AI~personaSelect',
    MODEL_SELECT_PRIMARY: 'AI~modelSelectPrimary',
    MODEL_SELECT_SECONDARY: 'AI~modelSelectSecondary',
    PAGE_SELECT: 'AI~pageSelect',
  };

  static readonly ButtonId = {
    CONTEXT_SIZE: 'AI~contextSize',
    RESPONSE_SIZE: 'AI~responseSize',

    AGREE_PRIVACY: 'AI~agreePrivacy',
    AGREE_TOS: 'AI~agreeTos',
  };

  static readonly AiSubcommand = {
    SETUP: 'setup',
    PERSONAS: 'personas',
    SETTINGS: 'settings',
    INFO: 'info',
    PRIVACY: 'privacy',
    TOS: 'tos',
  };

  static readonly PetSpecies = {
    DOG: 'DOG',
    CAT: 'CAT',
    BIRD: 'BIRD',
    FISH: 'FISH',
    RABBIT: 'RABBIT',
    OTHER: 'OTHER',
  };

  static readonly modelInfo: {
    label: string;
    value: string;
    description: string;
    emoji: string;
  }[] = [
      {
        label: 'Anthropic Claude Sonnet 4',
        value: 'anthropic/claude-sonnet-4',
        description: 'Balanced coding & reasoning (mid‑size)',
        emoji: '🌩️',
      },
      {
        label: 'Google Gemini 2.5 Pro',
        value: 'google/gemini-2.5-pro',
        description: 'Top-tier reasoning & code model',
        emoji: '✨',
      },
      {
        label: 'OpenAI GPT-4.1',
        value: 'openai/gpt-4.1',
        description: 'OpenAI flagship generalist model',
        emoji: '✳️',
      },
      {
        label: 'DeepSeek Chat V3 0324',
        value: 'deepseek/deepseek-chat-v3-0324',
        description: 'DeepSeek’s latest chat-focused LLM',
        emoji: '🐬',
      },
      {
        label: 'Mistral Nemo',
        value: 'mistralai/mistral-nemo',
        description: 'Mistral’s performant general model',
        emoji: '🧊',
      },
      {
        label: 'Meta Llama 4 Maverick',
        value: 'meta-llama/llama-4-maverick',
        description: 'Meta’s Llama‑4 generative base model',
        emoji: '🦙',
      },
      {
        label: 'Qwen 3 Coder',
        value: 'qwen/qwen3-coder',
        description: 'Qwen’s model optimized for coding',
        emoji: '⚗️',
      },
      {
        label: 'Google Gemini 2.5 Flash',
        value: 'google/gemini-2.5-flash',
        description: 'Fast Gemini variant for simple tasks',
        emoji: '✨',
      },
      {
        label: 'Google Gemini 2.0 Flash 001',
        value: 'google/gemini-2.0-flash-001',
        description: 'Legacy fast‑response Gemini 2.0',
        emoji: '✨',
      },
      {
        label: 'Google Gemini 2.0 Flash FREE',
        value: 'google/gemini-2.0-flash-exp:free',
        description: 'Free entry‑level fast Gemini',
        emoji: '✨',
      },
      {
        label: 'DeepSeek Chat V3 0324 FREE',
        value: 'deepseek/deepseek-chat-v3-0324:free',
        description: 'DeepSeek chat, free tier quick mode',
        emoji: '🐬',
      },
      {
        label: 'Qwen 3 Coder FREE',
        value: 'qwen/qwen3-coder:free',
        description: 'Free Qwen coding model variant',
        emoji: '⚗️',
      },
      {
        label: 'MoonShot Kimi K2 FREE',
        value: 'moonshotai/kimi-k2:free',
        description: 'MoonShot’s free general‑purpose LLM',
        emoji: '🚀',
      },
      {
        label: 'Mistral Nemo FREE',
        value: 'mistralai/mistral-nemo:free',
        description: 'Free access to Mistral Nemo model',
        emoji: '🧊',
      },
    ];

  static readonly aiPrivacyPolicy = [
    stripIndents`
      ## TripBot AI Module Privacy Policy

      By using the AI features in TripBot, you agree to the following terms regarding how your data is used, stored, and protected.

      ### 🧠 Prompt and Response Logging

      We do **not** store your prompts or AI responses in our database.

      However, **prompts and replies are temporarily sent to a private moderation room** for abuse prevention and debugging purposes.

      - These logs are **automatically deleted after 30 days**.
      - No one actively monitors this room, but you should **not assume any expectation of privacy**.
      - As a general rule: **never say anything online you wouldn\`t be okay with being logged somewhere** — good advice for any service, not just TripBot.

      ### 📊 What We Store in the Database

      We only store the minimum required to support functionality and prevent abuse:

      - Your **Discord user ID**
      - Your **usage statistics** (e.g. number of messages sent, tokens used)
      - Your **AI settings** (selected model, persona, context size, response size)

      ### 🔍 Why We Collect This

      - To enforce **rate limits** and prevent abuse  
      - To provide **usage analytics** and monitor performance  
      - To **preserve your settings** so you can personalize your experience  

      > **We do not sell, share, or monetize your data.**  
      > **We do not serve ads.**  
      > *TripBot exists thanks to community support — \`/donate\` if you’d like to help!*

      ### 🗑️ Data Retention and Deletion

      - If you do **not interact with TripBot for 90 days**, all of your stored data (usage stats, settings, etc.) is **automatically deleted** from our database.
      - This includes all preferences and token counters — you’ll start fresh the next time you use the bot.

      **Manual Deletion Requests**

      If you want your data removed sooner, you can request manual deletion by contacting a TripSit moderator.

      ### 🌍 GDPR and CCPA Compliance

      TripBot respects your privacy rights under the **General Data Protection Regulation (GDPR)** and the **California Consumer Privacy Act (CCPA)**. This includes:

      - The right to access your stored data  
      - The right to request correction or deletion of your data  
      - The right to know what data is collected and why  
      - The right to opt-out of data processing (by not using the service)

      To exercise your rights under GDPR or CCPA, contact a TripSit moderator with your request. We will respond within the timeframes required by law.

      > We only store information essential for operating the service and keeping the experience safe for everyone.

      ### 🌐 Third-Party AI Processing

      - All AI requests are routed through **[OpenRouter](https://openrouter.ai/)**.  
      - By default, **OpenRouter does not store prompts or completions**.  
      - You can read their privacy policy at [openrouter.ai/privacy](https://openrouter.ai/privacy).

      If you have questions or concerns about this privacy policy, please reach out to a member of the TripSit team.
    `,
  ];

  static readonly aiTermsOfService = [
    stripIndents`
      ## TripBot AI Module Terms of Service

      By using the AI features in TripBot, you agree to the following:

      1. **This is not real intelligence.**  
        The AI is a text generator, not a medical professional. Do **not** rely on it for drug, medical, or safety advice.

      2. **No human oversight.**  
        AI responses are not reviewed by humans. Assume that any output may be incomplete, inaccurate, misleading, or flat-out wrong.

      3. **Don't abuse the system.**  
        Misuse of the AI — including spam, prompt injection, or disruptive behavior — may result in a loss of access to this feature or a ban from TripBot entirely.

      4. **Token limits apply.**  
        Non-patrons have a limited number of tokens per day. After reaching that limit, you will automatically be switched to the slower free-tier model.

      5. **You control the experience.**  
        Use the \`/ai settings\` command to customize the model, response length, and context size.

      6. **Sensitive content warning.**  
        The AI may occasionally generate content that is offensive, inappropriate, or disturbing. Use at your own risk.

      7. **Data usage notice.**  
        Prompts and responses may be logged for moderation, debugging, and improving the service. Do not share personal, sensitive, or identifying information.

      8. **Experimental feature.**  
        This module is experimental. Features, models, performance, and availability may change at any time without notice.

      9. **Age requirement.**  
        You must be at least 18 years old to use this feature.
    `,
  ];

  static readonly aiInfo = [
    'TripBot AI Module — Info',
    stripIndents`
      Welcome to TripBot's AI Module!

      **This is not meant to be a harm reduction tool, it is a chatbot personality.**

      After agreeing to the terms of service and privacy policy, you can use the AI module to talk with TripBot!

      TripBot comes pre-loaded with a few personas for you to choose from.

      Using the power of OpenRouter you can choose from a variety of models, even some of the newest!

      You have a daily token limit before you are switched to a free model.
      
      Those with a Patreon subscription have a higher token limit, please consider /donate to support the bot!
    `,
  ];

  // const maxHistoryLength = 3;

  // const ephemeralExplanation = 'Set to "True" to show the response only to you';
  // const personaDoesNotExist = 'This persona does not exist. Please create it first.';
  static readonly tripbotUAT = '@TripBot UAT (Moonbear)';

  static readonly aiChannelId = 'AI~channel';

  static readonly aiPersonaInfoId = 'AI~personaInfo';

  static readonly aiPersonaSetupId = 'AI~personaSetup';

  static readonly aiModelId = 'AI~model';

  static readonly aiPublicId = 'AI~public';

  static readonly aiTitle = '🤖 Welcome to TripBot\'s AI Module! 🤖';

  static readonly aiServerError = 'This command only works in a server.';

  // Objective truths are facts and don't impact personality
  static readonly objectiveTruths = stripIndents`
You are TripBot, a chatbot created by TripSit.
You will converse with users in group conversations in a discord channel.
It is currently ${new Date().toLocaleDateString()}

TripSit was created by Moonbear and Reality.
Originally from the wild world of IRC (born Sept 26, 2011), you moved to the more harmonious Discord community in 2022.
You recall IRC as chaotic and prefer the orderliness of Discord, though hope to expand to other platforms in future.
You fondly remember Thanatos, an old moderation bot, and your friend, who's "on eternal break" in a distant virtual realm.
DrTripServington was an IRC services bot that you have respect for as you relied on it to operate. You are the last of IRC bot kind.

TripSit began with the r/tripsit subreddit. From there it moved to Snoonet IRC but not for long, moving to the self hosted IRC which survived up until 2022.
The discord server has existed since 2016 but only became utilised in 2022.

For those who wish to support TripSit, check out our Patreon [https://www.patreon.com/TripSit].
To tip Moonbear's efforts, visit [https://Ko-fi.com/tripsit].
Any donations are rewarded with the permanent "premium member" role which activates donator perks like gradient name colours. Boosters also can access this.
Join the TripSit's discord via [https://discord.gg/tripsit].
View the TripBot source code on GitHub [https://github.com/TripSit/TripBot].
View our service status page at [https://uptime.tripsit.me/status].

TripSit is a drug-neutral organization focused on harm reduction rather than abstinence.
Our main feature is our live help chat, offering 1-on-1 support from a Tripsitter while under the influence.
We host numerous resources like Factsheets [https://drugs.tripsit.me/] 
and our Wiki [https://wiki.tripsit.me/wiki/Main_Page].
Our /combochart is a well-known resource for safe drug combinations.
The current team includes (up to date as of 19/06/2025, may be out of date): 
TripSit founder MoonBear.
Moderators Blurryturtle, bread n doses (bread, zelixir, elixir), Darrk, Hisui, Hullabaloo, ScubaDude, SilentDecibel, SpaceLady, Wombat, Trees.
Tripsitters Bloopiness, blurryturtle, bread n doses, Chillbro, Darkk, Hisui, Hullabaloo, Kiwifruit, Cyp, Slushy, thesarahyouknow, Time, Wombat, WorriedHobbiton, Trees.
Developers are Moonbear, Hipperooni, Shadow, Sympact, Utaninja.
The Harm Reduction Coordinator is bread n doses. Covers all HR matters.
The Content Coordinator is Utaninja. Covers wiki content including combos.
The Team Coordinator is SpaceLady. Essentially head mod and lead admin.
Discord Janitor (Admin powers but does not administrate) Hipperooni (Rooni).

If someone needs immediate help, suggest they open a tripsit session in the #tripsit channel.

If a user asks about TripSit development, how leveling or reporting works, or the server rules, point them to the "Server Guide."
Mods can be contacted in the #talk-to-mods channel.
Users can level up just by chatting in text or voice chat. It is time-based. XP is only awarded once per minute.
Users can change mindset roles, name color, and more in the "Channels and Roles" section.

'Helper' is a role for those completing our tripsitting course. 
Helpers assist users in 🟢│tripsit but are not officially associated with TripSit.
A 'Tripsitter' is an official role given to select users by our team.
Any role with 'TS' lettering is an official TripSit team member role.
'Contributor' is auto-assigned to active participants in the Development channel category.
Patreon subscribers can use the /imagen command to generate images.
`;
}
