export default class KcAdminClient {
  auth = vi.fn().mockResolvedValue(undefined);

  isTokenExpired = vi.fn().mockReturnValue(false);

  users = {
    listFederatedIdentities: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockResolvedValue([]),
  };

  constructor(public config?: unknown) {}
}
