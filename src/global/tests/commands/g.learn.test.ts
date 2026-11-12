import {
  help, link, profile, unlink,
} from '../../commands/g.learn';

const mocks = vi.hoisted(() => ({
  tripbot: {
    users: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
  moodle: {
    mdl_user: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    mdl_user_enrolments: { findMany: vi.fn() },
  },
}));

vi.mock('../../../prisma/tripbot/client', () => ({ default: mocks.tripbot }));
vi.mock('../../../prisma/moodle/client', () => ({ default: mocks.moodle }));

describe('learn help', () => {
  it('describes TripSit Learn', async () => {
    const info = await help();
    expect(info.title).toBe('TripSitLearn Info');
    expect(info.description).toContain('/learn');
  });
});

describe('learn link', () => {
  it('requires a known user', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce(null);
    expect(await link('a@b.c', '1')).toMatch(/No user found with that Discord/);
  });

  it('requires a matching moodle email', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u' });
    mocks.moodle.mdl_user.findFirst.mockResolvedValueOnce(null);
    expect(await link('a@b.c', '1')).toMatch(/No user found with that email/);
  });

  it('stores the moodle username', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u' });
    mocks.moodle.mdl_user.findFirst.mockResolvedValueOnce({ username: 'mu' });
    mocks.tripbot.users.update.mockResolvedValueOnce({});
    expect(await link('a@b.c', '1')).toContain('(mu)');
    expect(mocks.tripbot.users.update).toHaveBeenCalledWith({ where: { id: 'u' }, data: { moodle_id: 'mu' } });
  });
});

describe('learn unlink', () => {
  it('reports unknown users', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce(null);
    expect(await unlink('1')).toMatch(/No user found/);
  });

  it('unlinks by discord id', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u' });
    mocks.tripbot.users.update.mockResolvedValueOnce({});
    expect(await unlink('1')).toContain('unlinked');
    expect(mocks.tripbot.users.update).toHaveBeenCalledWith({ where: { id: 'u' }, data: { moodle_id: null } });
  });

  it('unlinks by matrix id and survives update failures', async () => {
    mocks.tripbot.users.findFirst.mockResolvedValueOnce({ id: 'u' });
    mocks.tripbot.users.update.mockRejectedValueOnce(new Error('db'));
    expect(await unlink(undefined, '@m:x')).toContain('unlinked');
    await new Promise(resolve => { setImmediate(resolve); });
  });
});

describe('learn profile', () => {
  it('is empty for unlinked users', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u', moodle_id: null });
    expect(await profile('1')).toEqual({});
    mocks.tripbot.users.findFirst.mockResolvedValueOnce(null);
    expect(await profile(undefined, '@m:x')).toEqual({});
  });

  it('marks moodle as unreachable when the connection fails', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u', moodle_id: 'mu' });
    mocks.moodle.mdl_user.findMany.mockRejectedValueOnce(new Error('down'));
    expect(await profile('1')).toEqual({});
    expect(global.moodleConnection.status).toBe(false);
  });

  it('is empty when the moodle account is gone', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u', moodle_id: 'mu' });
    mocks.moodle.mdl_user.findMany.mockResolvedValueOnce([]);
    mocks.moodle.mdl_user.findUnique.mockResolvedValueOnce(null);
    expect(await profile('1')).toEqual({});
  });

  it('splits completed and incomplete courses', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u', moodle_id: 'mu' });
    mocks.moodle.mdl_user.findMany.mockResolvedValueOnce([]);
    mocks.moodle.mdl_user.findUnique.mockResolvedValueOnce({
      id: 5, firstname: 'A', lastname: 'B', institution: 'Inst', department: null,
    });
    const course = (fullname: string, completions: object[]) => ({ enrol: { course: { fullname, completions } } });
    mocks.moodle.mdl_user_enrolments.findMany.mockResolvedValueOnce([
      course('Done', [{ timecompleted: 1 }]),
      course('Started', [{ timecompleted: null }]),
      course('New', []),
    ]);
    expect(await profile('1')).toEqual({
      fullName: 'A B',
      institution: 'Inst',
      department: null,
      completedCourses: ['Done'],
      incompleteCourses: ['Started', 'New'],
    });
  });

  it('handles users with no enrolments', async () => {
    mocks.tripbot.users.findUnique.mockResolvedValueOnce({ id: 'u', moodle_id: 'mu' });
    mocks.moodle.mdl_user.findMany.mockResolvedValueOnce([]);
    mocks.moodle.mdl_user.findUnique.mockResolvedValueOnce({ id: 5, firstname: 'A', lastname: 'B' });
    mocks.moodle.mdl_user_enrolments.findMany.mockResolvedValueOnce([]);
    expect(await profile('1')).toMatchObject({ completedCourses: [], incompleteCourses: [] });
  });
});
