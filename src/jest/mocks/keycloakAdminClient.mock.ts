export default class KcAdminClient {
  auth = jest.fn().mockResolvedValue(undefined);

  users = {
    listFederatedIdentities: jest.fn().mockResolvedValue([]),
    find: jest.fn().mockResolvedValue([]),
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config?: unknown) {}
}
