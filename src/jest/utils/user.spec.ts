// import assert from 'node:assert';
import type { Knex } from 'knex';
// import createDiscordApi, { DiscordApi } from '../discord-api';
// import getTestUsers, { TestUsers } from '../test-users';
// import { uuidPattern } from '../patterns';

jest.mock('../../../../discord-api');

let knex: Knex;
// let discordApi: DiscordApi;
// let testUsers: TestUsers;
beforeAll(async () => {
  // discordApi = createDiscordApi();
  // testUsers = await getTestUsers(knex);
});

afterAll(async () => knex.destroy());

describe('Query', () => {
  describe('users', () => {
  });
});

describe('Mutation', () => {
  describe('createUser', () => {
  });
});

describe('User', () => {
  test('discord', async () => {
  });
});
