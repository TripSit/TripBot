import { dTriptoys } from '../../commands/global/d.triptoys';
import { dIdose } from '../../commands/global/d.idose';
import { dCombo } from '../../commands/global/d.combo';
import { dLearn } from '../../commands/global/d.learn';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';

const e = env as unknown as Record<string, string>;
const mocks = vi.hoisted(() => ({
  idose: vi.fn(), runPager: vi.fn(), combo: vi.fn(), help: vi.fn(), link: vi.fn(), unlink: vi.fn(), profile: vi.fn(), getMember: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.idose', () => ({ idose: mocks.idose }));
vi.mock('../../utils/pager', () => ({ runPager: mocks.runPager, default: mocks.runPager }));
vi.mock('../../../global/commands/g.combo', () => ({ combo: mocks.combo }));
vi.mock('../../../global/commands/g.learn', () => ({
  help: mocks.help, link: mocks.link, unlink: mocks.unlink, profile: mocks.profile,
}));
vi.mock('../../utils/guildMemberLookup', () => ({ getDiscordMember: mocks.getMember }));

const embedOf = (stub: ReturnType<typeof slashStub>) => (lastReply(stub).embeds as Array<{ data: Record<string, unknown> & { fields?: Array<{ name: string; value: string }> } }>)[0].data;

describe('triptoys', () => {
  it('shows every toy by default', async () => {
    const stub = slashStub();
    await dTriptoys.execute(stub as never);
    expect(embedOf(stub).title).toBe('Triptoys!');
    expect(embedOf(stub).fields).toHaveLength(22);
  });

  it('shows a specific toy, or a random one', async () => {
    const one = slashStub({ options: { toy: '1', ephemeral: true } });
    await dTriptoys.execute(one as never);
    expect(embedOf(one).fields?.[0].name).toBe('Weavesilk');
    const random = slashStub({ options: { toy: '24' } });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    await dTriptoys.execute(random as never);
    expect(embedOf(random).fields).toHaveLength(1);
    vi.restoreAllMocks();
  });
});

describe('idose', () => {
  const set = {
    volume: 100, units: 'µG', substance: 'LSD', roa: 'ORAL',
  };

  it('records doses, privately in guilds and in the DM otherwise', async () => {
    mocks.idose.mockResolvedValue([{ name: 'Success', value: 'ok' }]);
    const stub = slashStub({ subcommand: 'set', options: { ...set, offset: '1h' } });
    expect(await dIdose.execute(stub as never)).toBe(true);
    expect(stub.deferReply).toHaveBeenCalledWith({ flags: 64 });
    expect(embedOf(stub).title).toBe('New iDose entry:');
    expect(embedOf(stub).fields?.[0].name).toContain('100 µG of LSD Oral');
    expect(stub.user.send).toHaveBeenCalled();
    const dm = slashStub({ subcommand: 'set', options: set, channel: { type: 1 } });
    await dIdose.execute(dm as never);
    expect(dm.deferReply).toHaveBeenCalledWith({ flags: undefined });
    expect(dm.user.send).not.toHaveBeenCalled();
  });

  it('refuses to record doses without a route', async () => {
    mocks.idose.mockResolvedValue([{ name: 'Success', value: 'ok' }]);
    const stub = slashStub({ subcommand: 'set', options: { volume: 1, units: 'MG', substance: 'x' } });
    expect(await dIdose.execute(stub as never)).toBe(false);
  });

  it('relays errors and deletion results', async () => {
    mocks.idose.mockResolvedValue([{ name: 'Error', value: 'That drug does not exist!' }]);
    const err = slashStub({ subcommand: 'set', options: set });
    expect(await dIdose.execute(err as never)).toBe(false);
    expect(lastReply(err).content).toBe('That drug does not exist!');
    mocks.idose.mockResolvedValue([{ name: 'Success', value: 'I deleted: x' }]);
    const del = slashStub({ subcommand: 'delete', options: { record: 0 } });
    await dIdose.execute(del as never);
    expect(lastReply(del).content).toBe('I deleted: x');
  });

  it('pages through history, most recent first', async () => {
    mocks.idose.mockResolvedValue([{ name: 'old', value: '1' }, { name: 'new', value: '2' }]);
    const stub = slashStub({ subcommand: 'get' });
    await dIdose.execute(stub as never);
    const [, options] = mocks.runPager.mock.calls[0] as unknown as [unknown, { pageCount: number; renderPage: (i: number) => Promise<{ embeds: Array<{ data: { fields: Array<{ name: string }> } }> }> }];
    expect(options.pageCount).toBe(2);
    expect((await options.renderPage(0)).embeds[0].data.fields[0].name).toBe('new');
  });
});

describe('combo', () => {
  const opts = { first_drug: 'lsd', second_drug: 'mdma' };
  const success = (over: Record<string, unknown> = {}) => ({
    result: 'Caution',
    definition: 'Be careful',
    thumbnail: 'https://thumb',
    color: 'Yellow',
    emoji: '⚠️',
    interactionCategoryA: 'a',
    interactionCategoryB: 'b',
    ...over,
  });

  it('reports unknown pairs without implying safety', async () => {
    mocks.combo.mockResolvedValue({ err: true, msg: 'lsd not found. Try one of:' });
    const stub = slashStub({ options: opts });
    expect(await dCombo.execute(stub as never)).toBe(false);
    expect(String(lastReply(stub).content)).toContain('does not mean combining them is safe');
  });

  it('explains same-class combinations with reference links', async () => {
    mocks.combo.mockResolvedValue({ err: true, msg: 'a and b are the same drug/class.' });
    const stub = slashStub({ options: opts });
    expect(await dCombo.execute(stub as never)).toBe(false);
    expect(embedOf(stub).fields).toHaveLength(2);
  });

  it('wraps links in other errors so they do not embed', async () => {
    mocks.combo.mockResolvedValue({ err: true, msg: 'No combo data found, see https://example.com/x for more' });
    const stub = slashStub({ options: opts });
    await dCombo.execute(stub as never);
    expect(lastReply(stub).content).toContain('<https://example.com/x>');
    mocks.combo.mockResolvedValue({ err: true, msg: 'No combo data found for a and b.' });
    const plain = slashStub({ options: opts });
    await dCombo.execute(plain as never);
    expect(lastReply(plain).content).toBe('No combo data found for a and b.');
  });

  it('shows interaction details with sources split into research and experiences', async () => {
    mocks.combo.mockResolvedValue(success({
      note: 'extra note',
      sources: [{ author: 'a', title: 'Paper', url: 'https://journal/x' }, { author: 'b', title: 'Trip report', url: 'https://erowid.org/experiences/1' }],
    }));
    const stub = slashStub({ options: { ...opts, ephemeral: true } });
    expect(await dCombo.execute(stub as never)).toBe(true);
    const data = embedOf(stub);
    expect(data.title).toBe('Mixing lsd and mdma: ⚠️ Caution ⚠️');
    expect(data.description).toContain('**Note: extra note**');
    expect(data.fields?.map(f => f.name)).toEqual(expect.arrayContaining(['⚗️ Research Articles', 'lsd', 'mdma']));
    expect(data.fields?.some(f => f.name.includes('Erowid Experiences'))).toBe(true);
    expect(data.thumbnail).toBeDefined();
  });

  it('works without sources, thumbnail or colour, and recovers when the reply fails', async () => {
    mocks.combo.mockResolvedValue(success({ thumbnail: '', color: '' }));
    const stub = slashStub({ options: opts });
    stub.editReply.mockRejectedValueOnce(new Error('Unknown Message'));
    expect(await dCombo.execute(stub as never)).toBe(true);
    expect(stub.deleteReply).toHaveBeenCalled();
    expect(stub.followUp).toHaveBeenCalledWith(expect.objectContaining({ flags: 64 }));
  });
});

describe('learn', () => {
  const profileData = (over: Record<string, unknown> = {}) => ({
    fullName: 'Ally A', institution: 'Inst', department: 'Dept', completedCourses: ['A', 'B'], incompleteCourses: ['C'], ...over,
  });
  const ownerId = () => e.DISCORD_OWNER_ID;

  it('shows help', async () => {
    mocks.help.mockResolvedValue({ title: 'T', description: 'D', footer: 'F' });
    const stub = slashStub({ subcommand: 'help' });
    await dLearn.execute(stub as never);
    expect(embedOf(stub).title).toBe('T');
  });

  it('links accounts privately, validating the email', async () => {
    mocks.link.mockResolvedValue('linked!');
    const ok = slashStub({ subcommand: 'link', options: { email: 'a@b.c' } });
    await dLearn.execute(ok as never);
    expect(ok.deferReply).toHaveBeenCalledWith({ flags: 64 });
    expect(mocks.link).toHaveBeenCalledWith('a@b.c', 'u1');
    const bad = slashStub({ subcommand: 'link', options: { email: 'nope' } });
    await dLearn.execute(bad as never);
    expect(embedOf(bad).description).toContain("doesn't look like a valid email");
  });

  it('lets only the owner link or unlink other users', async () => {
    mocks.link.mockResolvedValue('linked!');
    mocks.unlink.mockResolvedValue('unlinked!');
    const denied = slashStub({ subcommand: 'link', options: { email: 'a@b.c', discord_id: '999' } });
    await dLearn.execute(denied as never);
    expect(embedOf(denied).description).toContain('not allowed');
    const owner = slashStub({ subcommand: 'link', options: { email: 'a@b.c', discord_id: '999' }, user: { id: ownerId() } });
    await dLearn.execute(owner as never);
    expect(mocks.link).toHaveBeenCalledWith('a@b.c', '999');
    const badEmail = slashStub({ subcommand: 'link', options: { email: 'nope', discord_id: '999' }, user: { id: ownerId() } });
    await dLearn.execute(badEmail as never);
    expect(embedOf(badEmail).description).toContain('valid email');
    const unlinkDenied = slashStub({ subcommand: 'unlink', options: { discord_id: '999' } });
    await dLearn.execute(unlinkDenied as never);
    expect(embedOf(unlinkDenied).description).toContain('not allowed');
    const unlinkOwner = slashStub({ subcommand: 'unlink', options: { discord_id: '999' }, user: { id: ownerId() } });
    await dLearn.execute(unlinkOwner as never);
    expect(mocks.unlink).toHaveBeenCalledWith('999');
    const self = slashStub({ subcommand: 'unlink' });
    await dLearn.execute(self as never);
    expect(mocks.unlink).toHaveBeenLastCalledWith('u1');
  });

  it('shows learning profiles', async () => {
    mocks.profile.mockResolvedValue(profileData());
    const self = slashStub({ subcommand: 'profile', member: { id: 'u1', displayName: 'Ally' } });
    await dLearn.execute(self as never);
    const data = embedOf(self) as unknown as { author: { name: string }; fields: Array<{ name: string }> };
    expect(data.author.name).toBe('Ally - Dept of Inst\n');
    expect(data.fields.map(f => f.name)).toEqual(['Completed Courses', 'Enrolled Courses']);
    mocks.profile.mockResolvedValue(profileData({ completedCourses: [], incompleteCourses: [], department: null }));
    const bare = slashStub({ subcommand: 'profile', member: { id: 'u1', displayName: 'Ally' } });
    await dLearn.execute(bare as never);
    expect((embedOf(bare) as { author: { name: string } }).author.name).toBe('Ally');
  });

  it('handles unlinked users and ambiguous lookups', async () => {
    mocks.profile.mockResolvedValue({});
    const unlinked = slashStub({ subcommand: 'profile', member: { id: 'u1', displayName: 'Ally' } });
    await dLearn.execute(unlinked as never);
    expect(embedOf(unlinked).description).toContain('does not have a linked TSL account');
    mocks.getMember.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const many = slashStub({ subcommand: 'profile', options: { user: 'bob' } });
    await dLearn.execute(many as never);
    expect(embedOf(many).title).toContain('more than one user');
    mocks.getMember.mockResolvedValue([]);
    const none = slashStub({ subcommand: 'profile', options: { user: 'bob' } });
    await dLearn.execute(none as never);
    expect(embedOf(none).title).toContain('no users');
    mocks.getMember.mockResolvedValue([undefined]);
    const missing = slashStub({ subcommand: 'profile', options: { user: 'bob' } });
    await dLearn.execute(missing as never);
    expect(embedOf(missing).description).toBe('Member not found!');
  });

  it('ignores unknown subcommands', async () => {
    const stub = slashStub({ subcommand: 'bogus' });
    expect(await dLearn.execute(stub as never)).toBe(true);
  });
});
