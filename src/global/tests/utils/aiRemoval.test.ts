import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';

// Explicitly opt in: this suite creates and removes its own isolated PostgreSQL container.
describe.skipIf(process.env.TRIPBOT_TEST_AI_MIGRATION !== '1')('AI purge migration', () => {
  const container = `tripbot-ai-migration-test-${process.pid}`;
  const migration = readFileSync('src/prisma/tripbot/migrations/20261124150000_remove_ai_chat_history/migration.sql', 'utf8');
  const overhaul = readFileSync('src/prisma/tripbot/migrations/20260419175925_ai_overhaul/migration.sql', 'utf8');
  const moderation = readFileSync('src/prisma/tripbot/migrations/20231115203612_ai_mod_update/migration.sql', 'utf8');
  const history = `${overhaul}\n${moderation}`;
  const tableSql = history.match(/CREATE TABLE "ai_[^;]+;/g)?.join('\n') ?? '';
  const foreignKeySql = history.match(/ALTER TABLE "ai_[^;]+ADD CONSTRAINT[^;]+;/g)?.join('\n') ?? '';

  function sql(input: string): string {
    return execFileSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'], {
      input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  beforeAll(async () => {
    execFileSync('docker', ['run', '--detach', '--name', container, '--network', 'none',
      '--env', 'POSTGRES_PASSWORD=disposable-test-only', 'postgres:15.4']);
    await vi.waitFor(() => {
      execFileSync('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'], { stdio: 'pipe' });
    }, { timeout: 20000, interval: 250 });
  }, 30000);

  afterAll(() => {
    execFileSync('docker', ['rm', '--force', '--volumes', container], { stdio: 'pipe' });
  });

  beforeEach(() => {
    sql(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE users (id UUID PRIMARY KEY, marker TEXT);
      CREATE TABLE discord_guilds (id TEXT PRIMARY KEY);
      CREATE TABLE command_usage (command TEXT PRIMARY KEY, usage_count INTEGER);
      INSERT INTO command_usage VALUES ('ai', 1), ('ai settings', 2), ('Translate', 3), ('help', 4);
      ${tableSql}
      ${foreignKeySql}
      INSERT INTO users VALUES ('00000000-0000-0000-0000-000000000001', 'preserve-me');
      INSERT INTO discord_guilds VALUES ('test-guild');
      INSERT INTO ai_info (id, user_id, ai_tos_agree, ai_privacy_agree, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
          '2026-01-01', '2026-01-02', now());
      INSERT INTO ai_persona (id, name) VALUES ('00000000-0000-0000-0000-000000000003', 'test');
      INSERT INTO ai_message (ai_persona_id, message_id, ai_info_id)
        VALUES ('00000000-0000-0000-0000-000000000003', 'linked', '00000000-0000-0000-0000-000000000002'),
          ('00000000-0000-0000-0000-000000000003', 'unlinked', NULL);
      INSERT INTO ai_image (ai_info_id, prompt, revised_prompt, image_url, model)
        VALUES ('00000000-0000-0000-0000-000000000002', 'synthetic', 'synthetic', 'synthetic', 'test');
      INSERT INTO ai_channel (channel_id, guild_id) VALUES ('test-channel', 'test-guild');
      INSERT INTO ai_moderation (guild_id, harassment) VALUES ('test-guild', 0.73);`);
  });

  it.each([false, true])('purges chat data and preserves consent and other features (legacy columns: %s)', legacy => {
    if (legacy) {
      sql(`ALTER TABLE users ADD COLUMN ai_history_google TEXT, ADD COLUMN ai_history_openai TEXT,
        ADD COLUMN ai_terms_agree BOOLEAN;
        UPDATE users SET ai_history_google = 'synthetic', ai_history_openai = 'synthetic', ai_terms_agree = true;`);
    }
    sql(migration);
    const tables = sql(`SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'ai_%';`);
    expect(tables.trim()).toBe('2');
    expect(sql('SELECT count(*) FROM ai_info WHERE ai_tos_agree IS NOT NULL AND ai_privacy_agree IS NOT NULL;')
      .trim()).toBe('1');
    expect(sql('SELECT harassment FROM ai_moderation;').trim()).toBe('0.73');
    expect(sql(`SELECT count(*) FROM information_schema.columns WHERE table_name = 'ai_info'
      AND column_name = 'persona_id';`).trim()).toBe('0');
    const columns = sql(`SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name LIKE 'ai_%';`);
    expect(columns.trim()).toBe('0');
    expect(sql('SELECT marker FROM users;').trim()).toBe('preserve-me');
    expect(sql('SELECT id FROM discord_guilds;').trim()).toBe('test-guild');
    expect(sql('SELECT command, usage_count FROM command_usage;').trim().split('\n').sort())
      .toEqual(['Translate|3', 'ai|1', 'help|4']);
  });

  it('rolls back the purge if a dependency prevents a table drop', () => {
    sql('CREATE VIEW retained_dependency AS SELECT id FROM ai_persona;');
    expect(() => sql(migration)).toThrow();
    expect(sql('SELECT count(*) FROM ai_message;').trim()).toBe('2');
    expect(sql('SELECT count(*) FROM ai_image;').trim()).toBe('1');
  });
});
