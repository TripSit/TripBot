import { ComponentType } from 'discord.js';
import { AiButton } from '../../../utils/ai/buttons';
import { AiModal } from '../../../utils/ai/modals';
import { AiMenu } from '../../../utils/ai/menus';
import { AiPersona, DEFAULT_PERSONALITY_CONFIG } from '../../../utils/ai/personas';
import { AiText } from '../../../utils/ai/texts';
import { AiFunction } from '../../../utils/ai/functions';
import WeatherClient from '../../../utils/aiClients/weather.client';
import OpenAiClient from '../../../utils/aiClients/openai.client';
import { OpenRouterClient, getModels } from '../../../utils/aiClients/openrouter.client';
import { dbMock } from '../../../../vitest/utils/mockDb';
import { collectionOf } from '../../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  embeddings: vi.fn(), doGenerate: vi.fn(), chatFactory: vi.fn(), createOpenRouter: vi.fn(),
}));

vi.mock('../../../commands/global/d.drug', () => ({ getDrugInfo: vi.fn() }));
vi.mock('openai', () => ({ default: class { embeddings = { create: mocks.embeddings }; } }));
vi.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: (...args: unknown[]) => {
    mocks.createOpenRouter(...args);
    return { chat: (...chatArgs: unknown[]) => { mocks.chatFactory(...chatArgs); return { doGenerate: mocks.doGenerate }; } };
  },
}));

const e = env as unknown as Record<string, string>;

describe('static AI UI pieces', () => {
  it('builds the agreement buttons', () => {
    expect(AiButton.agreePrivacy.toJSON()).toMatchObject({ custom_id: AiText.ButtonId.AGREE_PRIVACY, style: 3 });
    expect(AiButton.agreeTos.toJSON()).toMatchObject({ custom_id: AiText.ButtonId.AGREE_TOS });
  });

  it('builds size modals pre-filled with the current value', () => {
    const response = AiModal.responseSize(500).toJSON();
    expect(response.custom_id).toBe(AiModal.ID.RESPONSE_SIZE);
    expect(JSON.stringify(response)).toContain('"value":"500"');
    expect(JSON.stringify(AiModal.contextSize(12345).toJSON())).toContain('"max_length":5');
  });

  it('builds menus listing every persona and page', () => {
    const personaCount = Object.keys(AiPersona.List).length;
    expect(AiMenu.aiPersonaInfo().toJSON().options).toHaveLength(personaCount);
    expect(AiMenu.aiPersonasSelect().toJSON().custom_id).toBe(AiText.MenuId.PERSONA_SELECT);
    expect(AiMenu.pageSelect().toJSON().options).toHaveLength(Object.keys(AiText.Page).length);
    expect(AiMenu.guildChannels.toJSON()).toMatchObject({ min_values: 0, max_values: 10 });
  });

  it('keeps persona ids unique and consistent with the lookup table', () => {
    Object.entries(AiPersona.List).forEach(([id, persona]) => {
      expect(persona.id).toBe(id);
      expect(persona.config.communicationStyle).toBeDefined();
    });
    expect(DEFAULT_PERSONALITY_CONFIG.language.profanityLevel).toBe('none');
    expect(AiPersona.SassyBot.config.language.profanityLevel).toBe('mild');
  });

  it('exposes cost and model settings, and an objective-truths prompt naming the staff', () => {
    expect(AiText.maxDailyCostPremium).toBeGreaterThan(AiText.maxDailyCost);
    expect(AiText.objectiveTruths('**MODERATOR:** Sam')).toContain('Sam');
    expect(AiText.modPrompt.length).toBeGreaterThan(0);
  });
});

describe('AiFunction.getComponentById', () => {
  const row = (ids: string[]) => ({ type: ComponentType.ActionRow, components: ids.map(customId => ({ customId })) });

  it('finds a component whose id contains the search text', () => {
    const interaction = { message: { components: [row(['a~1']), row(['b~2', 'AI~target'])] } };
    expect(AiFunction.getComponentById(interaction as never, 'target')).toEqual({ customId: 'AI~target' });
  });

  it('returns null when nothing matches or rows are not action rows', () => {
    const interaction = { message: { components: [{ type: ComponentType.Container }, row(['x'])] } };
    expect(AiFunction.getComponentById(interaction as never, 'missing')).toBeNull();
  });
});

describe('AiFunction personas and prompts', () => {
  it('looks personas up by static name', () => {
    expect(AiFunction.getPersonaByName('TripBot' as never)).toBe(AiPersona.TripBot);
    expect(AiFunction.getPersonaByName('Nobody' as never)).toBeUndefined();
  });

  it.each(Object.values(AiPersona.List))('generates full and compact prompts for $name', persona => {
    const full = AiFunction.generatePersonalityPrompt(persona);
    expect(full).toContain(`You are ${persona.name}.`);
    expect(full).toContain('Never provide medical advice');
    const compact = AiFunction.generateCompactPersonalityPrompt(persona);
    expect(compact).toContain(`You are ${persona.name}:`);
    expect(compact).toContain('Never give medical advice');
    expect(compact.length).toBeLessThan(full.length);
  });

  it('omits optional sections for neutral personas and includes them for extreme ones', () => {
    const quiet = AiFunction.generatePersonalityPrompt(AiPersona.Archivist);
    expect(quiet).not.toContain('emojis');
    expect(quiet).not.toContain('sarcasm');
    const loud = AiFunction.generatePersonalityPrompt(AiPersona.SassyBot);
    expect(loud).toContain('mild profanity allowed');
    expect(loud).toContain('moderate sarcasm');
    expect(AiFunction.generateCompactPersonalityPrompt(AiPersona.SassyBot)).toContain('mild profanity OK');
  });

  it('exposes the drug lookup tool definition', () => {
    expect(AiFunction.aiFunctions[0].function.name).toBe('getDrugInfo');
    expect(AiFunction.availableFunctions.getDrugInfo).toBeDefined();
  });

  it('detects premium members', () => {
    const has = (id: string) => ({ roles: { cache: { has: (r: string) => r === id } } }) as never;
    expect(AiFunction.checkPremiumStatus(has(e.ROLE_BOOSTER))).toBe(true);
    expect(AiFunction.checkPremiumStatus(has(e.ROLE_TEAMTRIPSIT))).toBe(true);
    expect(AiFunction.checkPremiumStatus(has('nothing'))).toBe(false);
  });
});

describe('AiFunction.getStaffList', () => {
  it('groups staff by role and fills empty groups with None', async () => {
    const member = (username: string, roles: string[]) => ({ user: { username }, roles: { cache: new Set(roles) } });
    (global as unknown as { discordClient: unknown }).discordClient = {
      guilds: {
        fetch: vi.fn(async () => ({
          members: {
            fetch: vi.fn(async () => collectionOf({
              a: member('alice', [e.ROLE_TRIPSITTER, e.ROLE_MODERATOR]), b: member('bob', [e.ROLE_TRIPSITTER]), c: member('cat', []),
            })),
          },
        })),
      },
    };
    expect(await AiFunction.getStaffList()).toBe(
      '**TRIPSITTER:** alice, bob\n**MODERATOR:** alice\n**DEVELOPER:** None',
    );
  });
});

describe('AiFunction.pageMenu', () => {
  const placeholder = async (interaction: object) => {
    const menu = await AiFunction.pageMenu({
      isButton: () => false,
      isChatInputCommand: () => false,
      isStringSelectMenu: () => false,
      isChannelSelectMenu: () => false,
      ...interaction,
    } as never);
    return (menu.components[0].toJSON() as { placeholder: string }).placeholder;
  };

  it.each([
    ['info', AiText.Page.INFO], ['personas', AiText.Page.PERSONAS], ['setup', AiText.Page.GUILD_SETUP],
    ['settings', AiText.Page.USER_SETTINGS], ['privacy', AiText.Page.PRIVACY], ['tos', AiText.Page.TOS],
  ])('labels the %s subcommand', async (sub, page) => {
    const result = await placeholder({ isChatInputCommand: () => true, options: { getSubcommand: () => sub } });
    expect(result).toBe(`${page.emoji} ${page.label}`);
  });

  it('labels menu and button interactions', async () => {
    expect(await placeholder({ isStringSelectMenu: () => true, customId: AiText.MenuId.PERSONA_INFO })).toContain('AI Persona Info');
    expect(await placeholder({ isChannelSelectMenu: () => true, customId: AiText.MenuId.GUILD_CHANNELS })).toContain('Guild Setup');
    expect(await placeholder({ isStringSelectMenu: () => true, customId: AiText.MenuId.PERSONA_SELECT })).toContain('User Settings');
    expect(await placeholder({ isButton: () => true, customId: AiText.AiSubcommand.PRIVACY })).toContain('Privacy Policy');
  });

  it('follows the page select value, and falls back otherwise', async () => {
    expect(await placeholder({ isStringSelectMenu: () => true, customId: AiText.MenuId.PAGE_SELECT, values: ['tos'] })).toContain('Terms of Service');
    expect(await placeholder({ isStringSelectMenu: () => true, customId: AiText.MenuId.PAGE_SELECT, values: ['bogus'] })).toBe('Select a Page!');
    expect(await placeholder({ isButton: () => true, customId: 'AI~unknown' })).toBe('Select a Page');
    expect(await placeholder({})).toContain('AI Module Info');
  });
});

describe('AiFunction.createPrompt', () => {
  const botId = 'bot';

  function setup(messages: Array<{ id: string; author: string; text: string; mentions?: boolean }>) {
    (global as unknown as { discordClient: unknown }).discordClient = {
      user: { id: botId },
      guilds: { fetch: vi.fn(async () => ({ members: { fetch: vi.fn(async () => collectionOf({})) } })) },
    };
    const fetched = collectionOf(messages.map(m => [m.id, {
      author: { id: m.author }, cleanContent: m.text, mentions: { has: () => !!m.mentions },
    }] as [string, object]));
    return {
      guild: { members: { me: { nickname: 'TripBot' } } },
      channel: { messages: { fetch: vi.fn(async () => fetched) } },
      channelId: 'c',
    } as never;
  }

  it('builds a chronological prompt of the bot\'s replies and user messages addressed to it', async () => {
    // Discord returns newest first
    const message = setup([
      { id: '3', author: botId, text: 'Here is the answer' },
      { id: '2', author: 'u', text: 'ignored chatter' },
      {
        id: '1', author: 'u', text: '@TripBot what is LSD?', mentions: true,
      },
    ]);
    const prompt = await AiFunction.createPrompt(message, 'tripbot');
    expect(prompt.map(p => p.role)).toEqual(['system', 'system', 'user', 'assistant']);
    expect(JSON.stringify(prompt[2])).toContain('what is LSD?');
    expect(JSON.stringify(prompt[2])).not.toContain('@TripBot');
  });

  it('matches users who simply say tripbot, and skips unknown personas', async () => {
    const message = setup([{ id: '1', author: 'u', text: 'hey tripbot help' }]);
    const prompt = await AiFunction.createPrompt(message, 'no-such-persona');
    expect(prompt.map(p => p.role)).toEqual(['system', 'user']);
  });
});

describe('AiFunction.aiAudit', () => {
  const user = { id: 'u1', tag: 'alice#1' } as never;
  const message = (over: Record<string, unknown> = {}) => ({
    guild: { name: 'TripSit' }, guildId: 'g', channelId: 'c', cleanContent: 'hello', url: 'https://m', ...over,
  }) as never;
  const prompt = [
    { role: 'system', content: 'sys' },
    { role: 'user', content: [{ type: 'text', text: 'User: what is this' }] },
    { role: 'assistant', content: 'AI: plain string reply' },
    { role: 'user', content: [{ type: 'file' }] },
  ] as never;
  const response = { content: 'the reply', reasoning: undefined, usage: { cost: 0.01, promptTokens: 5, completionTokens: 7 } } as never;

  function logChannel(sendable = true) {
    const send = vi.fn();
    (global as unknown as { discordClient: unknown }).discordClient = {
      channels: { fetch: vi.fn(async () => (sendable ? { isSendable: (): boolean => true, send } : { isSendable: (): boolean => false })) },
    };
    return send;
  }

  it('posts an audit card with rolling cost for known AI users', async () => {
    const send = logChannel();
    dbMock.users.findUnique.mockResolvedValue({ ai_info: { id: 'ai1', persona_id: 'guardian', _count: { ai_messages: 1234 } } } as never);
    dbMock.ai_message.aggregate.mockResolvedValue({ _sum: { usd: 0.5 } } as never);
    await AiFunction.aiAudit(user, message(), prompt, response, 'model-x');
    expect(send).toHaveBeenCalledTimes(1);
    const text = JSON.stringify(send.mock.calls[0][0].components[0].toJSON());
    expect(text).toContain('guardian');
    expect(text).toContain('model-x');
    expect(text).toContain('Conversation Context');
    expect(text).toContain('last 24h');
  });

  it('handles users without AI records and DMs', async () => {
    const send = logChannel();
    dbMock.users.findUnique.mockResolvedValue(null);
    await AiFunction.aiAudit(user, message({ guild: null, guildId: null }), [] as never, { content: 'r', reasoning: undefined, usage: undefined } as never, 'm');
    const text = JSON.stringify(send.mock.calls[0][0].components[0].toJSON());
    expect(text).toContain('DMs');
    expect(text).toContain('N/A');
    expect(dbMock.ai_message.aggregate).not.toHaveBeenCalled();
  });

  it('refuses to log into a channel it cannot send to', async () => {
    logChannel(false);
    dbMock.users.findUnique.mockResolvedValue(null);
    await expect(AiFunction.aiAudit(user, message(), prompt, response, 'm')).rejects.toThrow('not a text channel');
  });
});

describe('WeatherClient', () => {
  const data = (values: Record<string, number>) => ({ data: { values } }) as never;

  it('summarises non-zero readings and converts temperatures', () => {
    const text = WeatherClient.summarizeWeather(data({
      temperature: 20, humidity: 50, windSpeed: 0, uvIndex: 3,
    }));
    expect(text).toContain('Temperature (in C): 20.0°C (68.0°F)');
    expect(text).toContain('Humidity (in %): 50');
    expect(text).toContain('UV Index: 3');
    expect(text).not.toContain('Wind Speed');
  });

  it('is empty when nothing is reported', () => {
    expect(WeatherClient.summarizeWeather(data({}))).toBe('');
  });

  it('fetches realtime weather for the configured location', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ json: async () => data({ temperature: 0.5, dewPoint: -1 }) } as never);
    const text = await new WeatherClient('key').getWeather();
    expect(fetchSpy.mock.calls[0][0]).toContain('apikey=key');
    expect(text).toContain('Dew Point');
    fetchSpy.mockRestore();
    expect(new WeatherClient()).toBeDefined();
  });
});

describe('OpenAiClient', () => {
  it('returns embeddings, or an empty vector when none come back', async () => {
    mocks.embeddings.mockResolvedValueOnce({ data: [{ embedding: [0.1, 0.2] }] });
    expect(await new OpenAiClient('k').embed({ input: 'hi' })).toEqual([0.1, 0.2]);
    mocks.embeddings.mockResolvedValueOnce({ data: [] });
    expect(await new OpenAiClient().embed({ input: 'hi' })).toEqual([]);
  });
});

describe('OpenRouterClient', () => {
  it('joins text parts and reports reasoning and usage', async () => {
    mocks.doGenerate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello ' }, { type: 'reasoning', text: 'because' }, { type: 'text', text: 'world' }],
      providerMetadata: { openrouter: { usage: { cost: 1 } } },
    });
    const result = await OpenRouterClient.chat({ prompt: [] as never, max_tokens: 50 });
    expect(result).toEqual({ content: 'Hello world', reasoning: 'because', usage: { cost: 1 } });
    expect(mocks.doGenerate).toHaveBeenCalledWith(expect.objectContaining({ maxOutputTokens: 50 }));
  });

  it('uses a placeholder for empty text and logs then rethrows failures', async () => {
    mocks.doGenerate.mockResolvedValue({ content: [], providerMetadata: { openrouter: { usage: undefined } } });
    expect((await OpenRouterClient.chat({ prompt: [] as never })).content).toBe('No response');
    mocks.doGenerate.mockRejectedValue(new Error('rate limited'));
    await expect(OpenRouterClient.chat({ prompt: [] as never, model: 'm' })).rejects.toThrow('rate limited');
  });

  it('lists the most expensive google models', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        data: [
          { id: 'google/cheap', pricing: { prompt: '1', completion: '1' } },
          { id: 'openai/other', pricing: { prompt: '9', completion: '9' } },
          { id: 'google/pricey', pricing: { prompt: '5', completion: '5' } },
        ],
      }),
    } as never);
    await getModels();
    const printed = String(log.mock.calls.at(-1)?.[0]);
    expect(printed.indexOf('google/pricey')).toBeLessThan(printed.indexOf('google/cheap'));
    expect(printed).not.toContain('openai/other');
    vi.restoreAllMocks();
  });
});
