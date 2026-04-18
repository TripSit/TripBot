import { stripIndents } from 'common-tags';

export class AiText {
  static readonly maxTokens = 100000;

  static readonly maxDailyCost = 0.05;

  static readonly maxDailyCostPremium = 0.5;

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

  static readonly primaryModel = 'google/gemini-3-flash-preview';

  static readonly backupModel = 'google/gemini-2.0-flash-lite-001';

  static readonly highEfficiencyModel = 'gpt-4o-mini';

  static readonly aiPrivacyPolicy = [
    stripIndents`
      # 🔒 AI Privacy Policy
      
      TripBot is built on the principle of **privacy by design**. We only collect what is strictly necessary to keep the lights on and the community safe.

      ### 🧠 Message Data & Logging
      - **Database Storage:** We do **not** store your prompts or AI-generated replies in our permanent database.
      - **Ephemeral Context:** To maintain a conversation, a short history of recent messages is temporarily held in the AI's "short-term memory." This is cleared when the session ends or context limits are reached.
      - **Moderation Logs:** For safety and abuse prevention, prompts are echoed to a private, internal moderation room. 
        - These logs are **automatically purged after 30 days**.
        - Access is restricted to the core TripSit development team for debugging and security audits.

      ### 📊 Metadata Collection
      We store the following "Metadata" linked to your Discord ID:
      - **Usage Stats:** Total tokens used, message counts, and generated image logs.
      - **Preferences:** Your currently active AI Persona and module settings.
      - **Safety Toggles:** Your agreement status for these Terms and Privacy Policy.

      ### 🔍 Third-Party Processing
      Requests are routed through **[OpenRouter](https://openrouter.ai/)**. 
      - By default, our configuration requests that OpenRouter **does not retain** your data for training or logging.
      - You can review their commitment to privacy at [openrouter.ai/privacy](https://openrouter.ai/privacy).

      ### 🗑️ Your Right to be Forgotten
      - **Auto-Deletion:** If you are inactive for **90 days**, all AI-related metadata (stats, settings, and history) is automatically wiped from our systems.
      - **Manual Purge:** You can request an immediate data wipe at any time by contacting a TripSit Moderator or Developer.

      > **We do not sell data. We do not serve ads. We do not track you across the web.**
      > *TripSit is community-funded. Support us via \`/donate\` to keep this service independent.*
    `,
  ];

  static readonly aiTermsOfService = [
    stripIndents`
      # ⚖️ AI Terms of Service

      **By enabling the AI module, you acknowledge and agree to the following:**

      ### 🛑 1. NOT A HARM REDUCTION TOOL
      **The AI is for entertainment purposes only.** It is a Large Language Model (LLM) that generates text based on patterns, not medical expertise.
      - **DO NOT** rely on TripBot AI for drug safety, dosage, or medical advice.
      - In an emergency, always use the **#tripsit** channel to speak with a human or contact local emergency services.

      ### 🎭 2. AI "Hallucinations"
      AI can and will be wrong. It may generate information that is factually incorrect, misleading, or potentially dangerous. There is **no human oversight** for individual AI responses.

      ### ⚡ 3. Fair Use & Credits
      - **Rolling Limits:** High-performance models are subject to daily credit limits. 
      - **Saver Tier:** Once your daily high-speed credits are exhausted, you will be switched to a "Saver" model until the midnight CST reset.
      - **Abuse:** Attempting to bypass limits, prompt-injecting the bot to violate safety guidelines, or spamming will result in an immediate and permanent AI ban.

      ### 🔞 4. Age & Content
      - You must be **18+** to use AI features.
      - While we use safety filters, the AI may occasionally produce content that is offensive or disturbing. Use at your own discretion.

      ### 🛠️ 5. Experimental Status
      This module is a "Beta" feature. We reserve the right to modify, swap, or disable specific models and personas at any time without prior notice.

      *Use common sense. The AI is a mirror of the internet, not a source of absolute truth.*
    `,
  ];

  static readonly aiInfo = [
    '# 🤖 TripBot AI',
    stripIndents`
    ### ⚠️ NOT A HARM REDUCTION TOOL
    **This AI is a chatbot personality for entertainment only.** 
    It is **not** a medical professional and cannot provide safety advice regarding substance use.
    For real help, please use our traditional channels.

    ### 🚀 Getting Started
    Once you agree to the TOS/Privacy policy, you can chat with me directly in enabled channels! 
    Use the menu below to:
    • **Pick a Persona:** Change my "vibe" (from helpful to chaotic).
    • **Check Settings:** See your current usage and limits.

    ### 💎 Credits & Tiers
    Everyone gets a daily allowance of **High-Performance** tokens (powered by Gemini Flash).
    • **Out of Credits?** You'll automatically switch to our **Saver Engine**—slower, but still free!
    • **Want more?** [Support us on Patreon](https://www.patreon.com/TripSit) for 10x higher limits and exclusive personas.
  `,
  ];

  static readonly aiGuildSetup = stripIndents`
    You can enable the AI in the channels/categories you choose below.

    **AI Enabled channels:**
  `;

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
  static objectiveTruths(staffList: string): string {
    return stripIndents`
      You are a chatbot created by TripSit.
      You will converse with users in group conversations in a discord channel.
      If you will use discord formatting, use it correctly. 
      For example, if you want to make a word bold, wrap it in double asterisks like **this**.
      If you want to make something a hyperlink use the format [text](url).
      It is currently ${new Date().toLocaleDateString()}

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

      ${staffList}
      `;
  }

  static readonly modPrompt = `You are acting as a moderation API. You will receive an input that a user wants to set as their user flair text.
  
      Drug references and jokes and adult humour are allowed as long as they are not extremely vulgur or offensive. You can swap any very rude words with more PG rated family friendly ones. If there are no alternative words, reject the flair.
      
      After that, adjust it to correct spelling, grammar and such. Made up words are allowed unless they are obvious misspellings, but no random keyboard gibberish (EG. ALRJRBSIEIR)
      
      IMPORTANT! You must correct capitalisation so that the flair fits headline capitalisation rules (every word should be capitalised except short words like "i love going to the supermarket" becomes "I Love Going to the Supermarket")
      
      You must reply with this strict format:
      Status: Approved, Adjusted, Rejected
      Reason: Spelling, grammar, etc
      Adjusted: The new edited flair, or the original flair if nothing was changed or adjusted`;
}

export default AiText;
