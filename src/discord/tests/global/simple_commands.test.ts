import { dTopic } from '../../commands/global/d.topic';
import { dMagick8ball } from '../../commands/global/d.magick8ball';
import { dlovebomb } from '../../commands/global/d.lovebomb';
import { dFact } from '../../commands/global/d.fact';
import { dHydrate } from '../../commands/global/d.hydrate';
import { dKipp } from '../../commands/global/d.kipp';
import { dInvite } from '../../commands/global/d.invite';
import { dConvert } from '../../commands/global/d.convert';
import { dPrivacy } from '../../commands/global/d.privacy';
import testkitsCommand from '../../commands/global/d.testkits';
import { emsCommand } from '../../commands/global/d.ems';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';
import { dbMock } from '../../../vitest/utils/mockDb';

const mocks = vi.hoisted(() => ({ fact: vi.fn(), ems: vi.fn() }));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.fact', () => ({ fact: mocks.fact }));
vi.mock('../../../global/commands/g.ems', () => ({ ems: mocks.ems }));

const run = async (command: { execute: (i: never) => Promise<boolean> }, opts: Parameters<typeof slashStub>[0] = {}) => {
  const stub = slashStub(opts);
  const result = await command.execute(stub as never);
  return { stub, result };
};

describe('simple fun commands', () => {
  it('topic replies with a random topic', async () => {
    const { stub, result } = await run(dTopic);
    expect(result).toBe(true);
    expect(lastReply(stub).content).toMatch(/^Random New Topic: \*\*.+\*\*$/);
  });

  it('magick8ball answers, and can respond ephemerally', async () => {
    const { stub } = await run(dMagick8ball, { options: { ephemeral: true } });
    expect(stub.deferReply).toHaveBeenCalledWith({ flags: 64 });
    expect(typeof lastReply(stub).content).toBe('string');
    const pub = await run(dMagick8ball);
    expect(pub.stub.deferReply).toHaveBeenCalledWith({ flags: undefined });
  });

  it('lovebomb sends thirty hearts', async () => {
    const { stub } = await run(dlovebomb);
    expect(String(lastReply(stub).content).split(' ').length).toBeGreaterThan(5);
  });

  it('fact shows the fact as the embed title', async () => {
    mocks.fact.mockResolvedValue('Honey never spoils');
    const { stub } = await run(dFact, { options: { ephemeral: true } });
    expect((lastReply(stub).embeds as Array<{ data: { title: string } }>)[0].data.title).toBe('Honey never spoils');
  });

  it('hydrate and kipp send reminders', async () => {
    const hydrate = await run(dHydrate);
    expect(JSON.stringify(lastReply(hydrate.stub))).toContain('ＨＹＤＲＡＴＩＯＮ');
    const kipp = await run(dKipp);
    expect(JSON.stringify(lastReply(kipp.stub))).toContain('Keep It Positive Please!');
  });
});

describe('invite', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => { process.env.NODE_ENV = original; });

  it('describes the dev bot outside production', async () => {
    process.env.NODE_ENV = 'development';
    const { stub } = await run(dInvite);
    const embed = (lastReply(stub).embeds as Array<{ data: { title: string; description: string } }>)[0].data;
    expect(embed.title).toBe('Invite TripBot Dev');
    expect(embed.description).toContain('development version');
  });

  it('describes the official bot in production', async () => {
    process.env.NODE_ENV = 'production';
    const { stub } = await run(dInvite, { options: { ephemeral: true } });
    const embed = (lastReply(stub).embeds as Array<{ data: { title: string; description: string } }>)[0].data;
    expect(embed.title).toBe('Invite TripBot');
    expect(embed.description).toContain('official support');
  });
});

describe('convert', () => {
  it('converts units', async () => {
    const { stub } = await run(dConvert, { options: { value: 1, units: 'km', into: 'm' } });
    expect((lastReply(stub).embeds as Array<{ data: { title: string } }>)[0].data.title).toBe('1 km is 1000.0000 m');
  });

  it('falls back to an ephemeral follow-up when the reply cannot be edited', async () => {
    const stub = slashStub({ options: { value: 1, units: 'km', into: 'm' } });
    stub.editReply.mockRejectedValueOnce(new Error('Unknown Message'));
    await dConvert.execute(stub as never);
    expect(stub.deleteReply).toHaveBeenCalled();
    expect(stub.followUp).toHaveBeenCalledWith(expect.objectContaining({ flags: 64 }));
  });
});

describe('privacy', () => {
  beforeEach(() => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'u1', email: 'a@b.c' } as never);
    dbMock.user_drug_doses.findMany.mockResolvedValue([]);
    dbMock.user_experience.findMany.mockResolvedValue([]);
    dbMock.user_reminders.findMany.mockResolvedValue([]);
  });
  const embedOf = (stub: ReturnType<typeof slashStub>) => (lastReply(stub).embeds as Array<{ data: { title: string; description: string } }>)[0].data;

  it('shows stored data', async () => {
    const { stub } = await run(dPrivacy, { subcommand: 'get' });
    expect(embedOf(stub).title).toBe('Your Data');
    expect(embedOf(stub).description).toContain('a@b.c');
  });

  it('asks for confirmation before deleting', async () => {
    const { stub } = await run(dPrivacy, { subcommand: 'delete' });
    expect(embedOf(stub).title).toBe('Are you sure?');
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });

  it('deletes data with the confirmation code', async () => {
    const { stub } = await run(dPrivacy, { subcommand: 'delete', options: { confirmation: 'YesPlease!' } });
    expect(embedOf(stub).title).toBe('Deleting Your Data');
    expect(dbMock.users.update).toHaveBeenCalled();
  });
});

describe('testkits', () => {
  it('lists vendors three to a row, padding the last row', async () => {
    const { stub } = await run(testkitsCommand as never);
    const embed = (lastReply(stub).embeds as Array<{ data: { fields: Array<{ name: string }>; description: string } }>)[0].data;
    expect(embed.fields.length % 3).toBe(0);
    expect(embed.fields[0].name).toContain('DanceSafe');
    expect(embed.description).toContain('wiki.tripsit.me');
  });
});

describe('ems', () => {
  const entry = (over: Record<string, unknown> = {}) => ({
    Country: { Name: 'Canada' },
    Suicide: '988',
    LocalOnly: false,
    Member_112: true,
    Ambulance: { All: ['911'], GSM: ['112'], Fixed: ['911'] },
    Police: { All: ['911'] },
    Fire: {},
    Dispatch: {},
    ...over,
  });

  it('reports when nothing matches', async () => {
    mocks.ems.mockResolvedValue([]);
    const { stub } = await run(emsCommand, { options: { country_search: 'zzz' } });
    expect(stub.editReply).toHaveBeenCalledWith(':x: No Countries Found');
    mocks.ems.mockResolvedValue(undefined);
    const none = await run(emsCommand, { options: {} });
    expect(none.stub.editReply).toHaveBeenCalledWith(':x: No Countries Found');
  });

  it('formats emergency numbers per country', async () => {
    mocks.ems.mockResolvedValue([entry(), entry({ Country: { Name: 'Local' }, LocalOnly: true }), entry({
      Country: { Name: 'Empty' }, Suicide: '', Member_112: false, Ambulance: {}, Police: {},
    })]);
    const { stub } = await run(emsCommand, { options: { country_search: 'can', ephemeral: true } });
    const embed = (lastReply(stub).embeds as Array<{ data: { fields: Array<{ name: string; value: string }>; footer?: unknown } }>)[0].data;
    expect(embed.fields[0].value).toContain('Suicide Hotline: `988`');
    expect(embed.fields[0].value).toContain('Ambulance GSM: `112`');
    expect(embed.fields[0].value).toContain('Dispatch Alias: `112`');
    expect(embed.fields[1].value).toBe('Local numbers only');
    expect(embed.fields[2].value).toBe('No data available');
    expect(JSON.stringify(embed.footer)).not.toContain('Results clipped');
  });

  it('clips long result lists', async () => {
    mocks.ems.mockResolvedValue(Array.from({ length: 30 }, (_, i) => entry({ Country: { Name: `Country ${i}` } })));
    const { stub } = await run(emsCommand, { options: { country_search: 'c' } });
    const embed = (lastReply(stub).embeds as Array<{ data: { fields: unknown[]; footer: { text: string } } }>)[0].data;
    expect(embed.fields).toHaveLength(24);
    expect(embed.footer.text).toContain('Results clipped');
  });
});
