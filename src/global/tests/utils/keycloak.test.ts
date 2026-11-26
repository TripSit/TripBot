type Identity = { identityProvider: string; userId?: string; userName?: string };

async function load() {
  vi.resetModules();
  const mod = await import('../../utils/keycloak');
  const client = await mod.getAdminClient();
  const users = client.users as unknown as {
    listFederatedIdentities: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };
  const auth = client.auth as unknown as ReturnType<typeof vi.fn>;
  return {
    mod, client, users, auth,
  };
}

const discord = (userId: string, userName = 'disc'): Identity => ({ identityProvider: 'discord', userId, userName });
const github = (userName: string): Identity => ({ identityProvider: 'github', userName });

describe('getAdminClient', () => {
  it('authenticates once and reuses the session', async () => {
    const { mod, auth } = await load();
    await mod.getAdminClient();
    await mod.getAdminClient();
    expect(auth).toHaveBeenCalledTimes(1);
    expect(auth).toHaveBeenCalledWith(expect.objectContaining({ grantType: 'client_credentials' }));
  });

  it('shares an in-flight authentication between concurrent callers', async () => {
    vi.resetModules();
    const mod = await import('../../utils/keycloak');
    const [a, b] = await Promise.all([mod.getAdminClient(), mod.getAdminClient()]);
    expect(a).toBe(b);
    expect((a.auth as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  });

  it('logs in again once the admin token has expired', async () => {
    const { mod, client, auth } = await load();
    const isTokenExpired = client.isTokenExpired as unknown as ReturnType<typeof vi.fn>;
    isTokenExpired.mockReturnValueOnce(true);
    await mod.getAdminClient();
    expect(auth).toHaveBeenCalledTimes(2);
    await mod.getAdminClient();
    expect(auth).toHaveBeenCalledTimes(2);
  });
});

describe('getDiscordIdFromFederatedIdentity', () => {
  it('returns the discord user id and caches it', async () => {
    const { mod, users } = await load();
    users.listFederatedIdentities.mockResolvedValue([github('gh'), discord('123')]);
    expect(await mod.getDiscordIdFromFederatedIdentity('kc1')).toBe('123');
    expect(await mod.getDiscordIdFromFederatedIdentity('kc1')).toBe('123');
    expect(users.listFederatedIdentities).toHaveBeenCalledTimes(1);
  });

  it('caches a missing discord provider as null', async () => {
    const { mod, users } = await load();
    users.listFederatedIdentities.mockResolvedValue([github('gh')]);
    expect(await mod.getDiscordIdFromFederatedIdentity('kc1')).toBeNull();
    expect(await mod.getDiscordIdFromFederatedIdentity('kc1')).toBeNull();
    expect(users.listFederatedIdentities).toHaveBeenCalledTimes(1);
  });

  it('refreshes expired cache entries', async () => {
    const { mod, users } = await load();
    users.listFederatedIdentities.mockResolvedValue([discord('123')]);
    vi.useFakeTimers();
    try {
      await mod.getDiscordIdFromFederatedIdentity('kc1');
      vi.setSystemTime(Date.now() + 6 * 60 * 1000);
      await mod.getDiscordIdFromFederatedIdentity('kc1');
    } finally {
      vi.useRealTimers();
    }
    expect(users.listFederatedIdentities).toHaveBeenCalledTimes(2);
  });

  it('re-authenticates and retries after a 401', async () => {
    const { mod, users, auth } = await load();
    users.listFederatedIdentities
      .mockRejectedValueOnce(new Error('Request failed with status code 401'))
      .mockResolvedValueOnce([discord('999')]);
    expect(await mod.getDiscordIdFromFederatedIdentity('kc2')).toBe('999');
    expect(auth).toHaveBeenCalledTimes(2);
  });

  it('re-authenticates and retries when the admin client cannot refresh its token', async () => {
    const { mod, users, auth } = await load();
    users.listFederatedIdentities
      .mockRejectedValueOnce(new Error('Cannot refresh token: missing refresh token or credentials'))
      .mockResolvedValueOnce([discord('999')]);
    expect(await mod.getDiscordIdFromFederatedIdentity('kc3')).toBe('999');
    expect(auth).toHaveBeenCalledTimes(2);
  });

  it('returns null after a 401 retry that finds no discord identity', async () => {
    const { mod, users } = await load();
    users.listFederatedIdentities
      .mockRejectedValueOnce(new Error('401'))
      .mockResolvedValueOnce([]);
    expect(await mod.getDiscordIdFromFederatedIdentity('kc3')).toBeNull();
  });

  it('throws when the retry also fails', async () => {
    const { mod, users } = await load();
    users.listFederatedIdentities.mockRejectedValueOnce(new Error('401')).mockRejectedValueOnce(new Error('still bad'));
    await expect(mod.getDiscordIdFromFederatedIdentity('kc4')).rejects.toThrow('still bad');
  });

  it('throws other errors without retrying', async () => {
    const { mod, users, auth } = await load();
    users.listFederatedIdentities.mockRejectedValueOnce(new Error('500'));
    await expect(mod.getDiscordIdFromFederatedIdentity('kc5')).rejects.toThrow('500');
    expect(auth).toHaveBeenCalledTimes(1);
  });
});

describe('getDiscordUserByGitHub', () => {
  it('finds the discord account linked to a github username (case-insensitive)', async () => {
    const { mod, users } = await load();
    users.find.mockResolvedValueOnce([{ id: 'k1', email: 'a@b.c' }, { id: 'k2' }]).mockResolvedValue([]);
    users.listFederatedIdentities.mockImplementation(async ({ id }: { id: string }) => (
      id === 'k1' ? [github('OctoCat'), discord('d1', 'cat')] : [github('other'), discord('d2')]
    ));
    expect(await mod.getDiscordUserByGitHub('octocat')).toEqual({
      id: 'd1', username: 'cat', keycloakUserId: 'k1', githubUsername: 'OctoCat', email: 'a@b.c',
    });
  });

  it('returns a null email when keycloak has none', async () => {
    const { mod, users } = await load();
    users.find.mockResolvedValueOnce([{ id: 'k1' }]).mockResolvedValue([]);
    users.listFederatedIdentities.mockResolvedValue([github('gh'), discord('d1')]);
    expect(await mod.getDiscordUserByGitHub('gh')).toMatchObject({ email: null });
  });

  it('returns null when nobody matches, has no discord link, or identities fail to load', async () => {
    const { mod, users } = await load();
    users.find.mockResolvedValueOnce([{ id: 'k1' }, { id: 'k2' }, { id: 'k3' }]).mockResolvedValue([]);
    users.listFederatedIdentities
      .mockResolvedValueOnce([github('other')])
      .mockResolvedValueOnce([github('gh')])
      .mockRejectedValueOnce(new Error('no identities'));
    expect(await mod.getDiscordUserByGitHub('gh')).toBeNull();
  });

  it('remembers a successful match for ten minutes, case-insensitively, without scanning Keycloak again', async () => {
    const { mod, users } = await load();
    users.find.mockResolvedValueOnce([{ id: 'k1' }]).mockResolvedValue([]);
    users.listFederatedIdentities.mockResolvedValue([github('OctoCat'), discord('d1', 'cat')]);
    const first = await mod.getDiscordUserByGitHub('octocat');
    expect(await mod.getDiscordUserByGitHub('OCTOCAT')).toBe(first);
    expect(users.find).toHaveBeenCalledTimes(1);

    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(Date.now() + 11 * 60 * 1000);
      users.find.mockResolvedValueOnce([{ id: 'k1' }]);
      await mod.getDiscordUserByGitHub('octocat');
      expect(users.find).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not remember a miss, so a freshly linked account is found on the next try', async () => {
    const { mod, users } = await load();
    users.find.mockResolvedValue([]);
    expect(await mod.getDiscordUserByGitHub('newbie')).toBeNull();
    users.find.mockResolvedValueOnce([{ id: 'k9' }]).mockResolvedValue([]);
    users.listFederatedIdentities.mockResolvedValue([github('newbie'), discord('d9')]);
    expect(await mod.getDiscordUserByGitHub('newbie')).toMatchObject({ id: 'd9' });
  });

  it('stops paging at the first short page instead of requesting every possible page', async () => {
    const { mod, users } = await load();
    const full = Array.from({ length: 100 }, (_unused, i) => ({ id: `k${i}` }));
    users.find.mockResolvedValueOnce(full).mockResolvedValueOnce([{ id: 'last' }]);
    users.listFederatedIdentities.mockResolvedValue([github('other')]);
    await mod.getDiscordUserByGitHub('gh');
    expect(users.find).toHaveBeenCalledTimes(2);
    expect(users.find).toHaveBeenNthCalledWith(1, expect.objectContaining({ first: 0, max: 100 }));
    expect(users.find).toHaveBeenNthCalledWith(2, expect.objectContaining({ first: 100, max: 100 }));
  });

  it('never reads past the safety limit of 10000 users', async () => {
    const { mod, users } = await load();
    const full = Array.from({ length: 100 }, (_unused, i) => ({ id: `k${i}` }));
    users.find.mockResolvedValue(full);
    users.listFederatedIdentities.mockResolvedValue([]);
    await mod.getDiscordUserByGitHub('gh');
    expect(users.find).toHaveBeenCalledTimes(100);
  });

  it('rethrows lookup failures', async () => {
    const { mod, users } = await load();
    users.find.mockRejectedValue(new Error('realm down'));
    await expect(mod.getDiscordUserByGitHub('gh')).rejects.toThrow('realm down');
  });

  it('exports the lookup as the default', async () => {
    const { mod } = await load();
    expect(mod.default).toBe(mod.getDiscordUserByGitHub);
  });
});

describe('log privacy', () => {
  it('never logs Keycloak ids, linked Discord ids or Discord usernames on lookup, cache, retry and failure paths', async () => {
    const spies = (['debug', 'info', 'warn', 'error'] as const).map(level => vi.spyOn(log, level));
    try {
      const { mod, users } = await load();
      users.listFederatedIdentities
        .mockResolvedValueOnce([discord('d-secret-9001', 'secret-discord-name')])
        .mockRejectedValueOnce(new Error('Request failed with status code 401'))
        .mockResolvedValueOnce([github('gh')])
        .mockRejectedValueOnce(new Error('401'))
        .mockRejectedValueOnce(new Error('boom'))
        .mockRejectedValueOnce(new Error('500'));
      await mod.getDiscordIdFromFederatedIdentity('kc-secret-1');
      await mod.getDiscordIdFromFederatedIdentity('kc-secret-1'); // cached
      await mod.getDiscordIdFromFederatedIdentity('kc-secret-2'); // 401 then retry without a Discord link
      await expect(mod.getDiscordIdFromFederatedIdentity('kc-secret-3')).rejects.toThrow();
      await expect(mod.getDiscordIdFromFederatedIdentity('kc-secret-4')).rejects.toThrow();

      users.find.mockResolvedValueOnce([{ id: 'kc-secret-5' }, { id: 'kc-secret-6' }]).mockResolvedValue([]);
      users.listFederatedIdentities.mockReset();
      users.listFederatedIdentities.mockImplementation(async ({ id }: { id: string }) => {
        if (id === 'kc-secret-6') throw new Error('no identities');
        return [github('gh'), { identityProvider: 'discord', userId: 'd-secret-9002', userName: 'secret-discord-name' }];
      });
      await mod.getDiscordUserByGitHub('gh');
      users.find.mockResolvedValueOnce([{ id: 'kc-secret-7' }]).mockResolvedValue([]);
      users.listFederatedIdentities.mockResolvedValue([github('gh')]);
      await mod.getDiscordUserByGitHub('gh');

      const logged = spies.flatMap(spy => spy.mock.calls.map(call => String(call[1]))).join('\n');
      expect(logged).not.toMatch(/kc-secret|d-secret|secret-discord-name/);
      expect(logged).toContain('Found Discord provider');
    } finally {
      spies.forEach(spy => spy.mockRestore());
    }
  });
});
