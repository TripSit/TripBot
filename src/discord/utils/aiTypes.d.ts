export type AiComponent =
  | TextDisplayBuilder
  | ActionRowBuilder<ChannelSelectMenuBuilder>
  | ActionRowBuilder<ButtonBuilder>;

export type AiInteraction =
  | StringSelectMenuInteraction
  | ChatInputCommandInteraction
  | ButtonInteraction;

export type PersonaId = 'tripbot' | 'chill_buddy' | 'wise_sage' | 'hype_beast' | 'sassy_bot';

export type FormalityLevel = 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
export type VerbosityLevel = 'very_brief' | 'brief' | 'moderate' | 'detailed' | 'very_detailed';
export type ToneType = 'serious' | 'neutral' | 'friendly' | 'playful' | 'sarcastic' | 'enthusiastic';
export type ProfanityLevel = 'none' | 'mild' | 'moderate' | 'heavy';
export type SlangUsage = 'none' | 'minimal' | 'moderate' | 'heavy' | 'generational';
export type EmojiFrequency = 'none' | 'rare' | 'occasional' | 'frequent' | 'excessive';
export type EmojiStyle = 'standard' | 'cute' | 'cool' | 'random' | 'thematic' | 'kaomoji';
export type PunctuationStyle = 'minimal' | 'standard' | 'expressive' | 'chaotic';
export type HumorType = 'none' | 'dry' | 'witty' | 'silly' | 'dark' | 'absurd';
export type ConfidenceLevel = 'uncertain' | 'modest' | 'balanced' | 'confident' | 'cocky';
export type EmpathyLevel = 'low' | 'moderate' | 'high' | 'excessive';
export type SarcasmLevel = 'none' | 'subtle' | 'moderate' | 'heavy';

export type CommunicationStyle = {
  formality: FormalityLevel;
  verbosity: VerbosityLevel;
  tone: ToneType;
};

export type LanguageSettings = {
  profanityLevel: ProfanityLevel;
  slangUsage: SlangUsage;
  emojiFrequency: EmojiFrequency;
  emojiStyle: EmojiStyle;
  punctuationStyle: PunctuationStyle;
};

export type PersonalityTraits = {
  humor: HumorType;
  confidence: ConfidenceLevel;
  empathy: EmpathyLevel;
  sarcasm: SarcasmLevel;
};

export type PersonalityConfig = {
  communicationStyle: CommunicationStyle;
  language: LanguageSettings;
  personality: PersonalityTraits;
};

export type PersonaSpec = {
  id: PersonaId;
  name: string;
  description: string;
  emoji: string;
  config: PersonalityConfig;
};

export interface ModelInfo {
  id: string;
  canonical_slug: string;
  hugging_face_id: string | null;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
    web_search: string;
    internal_reasoning: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits: any; // You can refine this if you know the structure
  supported_parameters: string[];
}

export interface WeatherData {
  data: {
    time: string; // ISO date string
    values: {
      cloudBase: number;
      cloudCeiling: number;
      cloudCover: number;
      dewPoint: number;
      freezingRainIntensity: number;
      humidity: number;
      precipitationProbability: number;
      pressureSurfaceLevel: number;
      rainIntensity: number;
      sleetIntensity: number;
      snowIntensity: number;
      temperature: number;
      temperatureApparent: number;
      uvHealthConcern: number;
      uvIndex: number;
      visibility: number;
      weatherCode: number;
      windDirection: number;
      windGust: number;
      windSpeed: number;
    };
  };
  location: {
    lat: number;
    lon: number;
    name: string;
    type: string;
  };
}
