/* eslint-disable max-classes-per-file */
import OpenAI from 'openai';
import {
  aiFlairMod, aiModerate, aiModerateReport, aiTranslate,
} from '../../commands/g.ai';
import { dbMock } from '../../../vitest/utils/mockDb';

const mocks = vi.hoisted(() => ({ moderationsCreate: vi.fn(), chatCreate: vi.fn() }));

vi.mock('openai', () => {
  class APIError extends Error {
    status = 429;

    type = 'rate_limit';

    headers = 'h';

    error = { message: 'slow down' };
  }
  class MockOpenAI {
    static APIError = APIError;

    moderations = { create: mocks.moderationsCreate };

    chat = { completions: { create: mocks.chatCreate } };
  }
  return { default: MockOpenAI };
});

vi.mock('../../../discord/utils/ai', () => ({ AiText: { highEfficiencyModel: 'test-model', modPrompt: 'mod prompt' } }));

const e = env as unknown as Record<string, string>;
const original = { org: e.OPENAI_API_ORG, key: e.OPENAI_API_KEY };

function enableAi() {
  e.OPENAI_API_ORG = 'org';
  e.OPENAI_API_KEY = 'key';
}

const apiError = () => new (OpenAI as unknown as { APIError: new () => Error }).APIError();

afterEach(() => {
  e.OPENAI_API_ORG = original.org;
  e.OPENAI_API_KEY = original.key;
});

describe('without credentials', () => {
  beforeEach(() => {
    e.OPENAI_API_ORG = '';
    e.OPENAI_API_KEY = '';
  });

  it('skips every AI call', async () => {
    expect(await aiModerateReport('hi')).toBeNull();
    expect(await aiFlairMod([])).toEqual({ response: '', promptTokens: 0, completionTokens: 0 });
    expect(await aiTranslate('fr', [])).toEqual({ response: '', promptTokens: 0, completionTokens: 0 });
    expect(await aiModerate('hi', 'g')).toEqual([]);
    expect(mocks.moderationsCreate).not.toHaveBeenCalled();
  });
});

describe('aiModerateReport', () => {
  beforeEach(enableAi);

  it('returns the moderation response', async () => {
    mocks.moderationsCreate.mockResolvedValueOnce({ results: [] });
    expect(await aiModerateReport('hi')).toEqual({ results: [] });
  });

  it('swallows API errors but rethrows unexpected ones', async () => {
    mocks.moderationsCreate.mockRejectedValueOnce(apiError());
    expect(await aiModerateReport('hi')).toBeNull();
    mocks.moderationsCreate.mockRejectedValueOnce(new Error('boom'));
    await expect(aiModerateReport('hi')).rejects.toThrow('boom');
  });
});

describe('aiModerate', () => {
  beforeEach(enableAi);

  it('returns nothing when the report is unavailable', async () => {
    mocks.moderationsCreate.mockRejectedValueOnce(apiError());
    expect(await aiModerate('hi', 'g')).toEqual([]);
  });

  it('flags only categories above the guild limit', async () => {
    mocks.moderationsCreate.mockResolvedValueOnce({
      results: [{
        category_scores: {
          harassment: 0.5, 'self-harm/intent': 0.9, hate: 0.001, sexual: 0.5, odd: 1,
        },
      }],
    });
    dbMock.discord_guilds.upsert.mockResolvedValueOnce({ id: 'gid' } as never);
    dbMock.ai_moderation.upsert.mockResolvedValueOnce({
      harassment: 0.1, self_harm_intent: 0.5, hate: 0.01, sexual: 'bad',
    } as never);

    const alerts = await aiModerate('hi', 'g');
    expect(alerts).toEqual([
      { category: 'harassment', value: 0.5, limit: 0.1 },
      { category: 'self-harm/intent', value: 0.9, limit: 0.5 },
    ]);
  });

  it('returns no alerts when everything is under the limits', async () => {
    mocks.moderationsCreate.mockResolvedValueOnce({ results: [{ category_scores: { harassment: 0.001 } }] });
    dbMock.discord_guilds.upsert.mockResolvedValueOnce({ id: 'gid' } as never);
    dbMock.ai_moderation.upsert.mockResolvedValueOnce({ harassment: 0.1 } as never);
    expect(await aiModerate('hi', 'g')).toEqual([]);
  });
});

describe.each([
  ['aiFlairMod', (m: never[]) => aiFlairMod(m)],
  ['aiTranslate', (m: never[]) => aiTranslate('fr', m)],
] as const)('%s', (_name, run) => {
  beforeEach(enableAi);

  it('returns the reply and token usage', async () => {
    mocks.chatCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'hello' } }], usage: { prompt_tokens: 3, completion_tokens: 4 },
    });
    expect(await run([])).toEqual({ response: 'hello', promptTokens: 3, completionTokens: 4 });
    expect(mocks.chatCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'test-model' }));
  });

  it('falls back to a polite default for empty content and missing usage', async () => {
    mocks.chatCreate.mockResolvedValueOnce({ choices: [{ message: { content: null } }] });
    expect(await run([])).toEqual({
      response: 'Sorry, I\'m not sure how to respond to that.', promptTokens: 0, completionTokens: 0,
    });
  });

  it('returns empty output on API errors and rethrows others', async () => {
    mocks.chatCreate.mockRejectedValueOnce(apiError());
    expect(await run([])).toEqual({ response: '', promptTokens: 0, completionTokens: 0 });
    mocks.chatCreate.mockRejectedValueOnce(new Error('boom'));
    await expect(run([])).rejects.toThrow('boom');
  });
});
