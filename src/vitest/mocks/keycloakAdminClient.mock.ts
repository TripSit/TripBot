export default class KcAdminClient {
  auth = vi.fn().mockResolvedValue(undefined);

  users = {
    listFederatedIdentities: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockResolvedValue([]),
  };

  constructor(public config?: unknown) {}
}
