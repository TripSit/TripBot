// Module-level constants that depend on NODE_ENV / optional secrets: load each module under both settings so
// both sides of the conditional run.
const mutableEnv = env as unknown as Record<string, string | undefined>;
const original = { ...mutableEnv };

afterEach(() => {
  Object.assign(mutableEnv, original);
  Object.keys(mutableEnv).forEach(key => { if (!(key in original)) delete mutableEnv[key]; });
});

const modules = [
  '../../utils/announcements',
  '../../utils/bestOfTripsit',
  '../../../global/utils/experience',
  '../../utils/modUtils',
  '../../commands/global/d.ai',
];

describe.each(['production', 'development'])('modules loaded with NODE_ENV=%s', nodeEnv => {
  it.each(modules)('%s imports cleanly', async path => {
    vi.resetModules();
    mutableEnv.NODE_ENV = nodeEnv;
    await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
  });
});

describe('env.config optional secrets', () => {
  it('falls back to empty strings when the keys are not set', async () => {
    const saved = { ...process.env };
    try {
      delete process.env.OPENAI_API_ORG;
      delete process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_KEY;
      vi.resetModules();
      vi.doMock('dotenv', () => ({ default: { config: vi.fn() }, config: vi.fn() }));
      const config = await import('../../../global/utils/env.config');
      expect(config.env.OPENAI_API_KEY).toBe('');
      expect(config.env.GEMINI_KEY).toBe('');
    } finally {
      process.env = saved;
      vi.doUnmock('dotenv');
    }
  });
});
