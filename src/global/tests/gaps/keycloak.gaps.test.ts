describe('getAdminClient failures', () => {
  afterEach(() => { vi.doUnmock('@keycloak/keycloak-admin-client'); });

  it('rethrows an authentication failure and tries again on the next call', async () => {
    const auth = vi.fn().mockRejectedValueOnce(new Error('keycloak down')).mockResolvedValue(undefined);
    vi.resetModules();
    vi.doMock('@keycloak/keycloak-admin-client', () => ({
      default: class {
        auth = auth;

        users = {};
      },
    }));
    const mod = await import('../../utils/keycloak');
    await expect(mod.getAdminClient()).rejects.toThrow('keycloak down');
    await expect(mod.getAdminClient()).resolves.toBeDefined();
    expect(auth).toHaveBeenCalledTimes(2);
  });
});
