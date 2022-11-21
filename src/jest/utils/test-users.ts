import type { Knex } from 'knex';
import { Users } from '../../global/@types/pgdb';

export interface TestUsers {
  moonBear: Users;
  sevenCats: Users;
  ajar: Users;
}

export default async function getTestUsers(knex: Knex): Promise<TestUsers> {
  return knex<Users>('users')
    .whereIn('username', ['MoonBear', 'SevenCats', 'AJAr'])
    .then(users => ({
      moonBear: users.find(user => user.username === 'MoonBear') as Users,
      sevenCats: users.find(user => user.username === 'SevenCats') as Users,
      ajar: users.find(user => user.username === 'AJAr') as Users,
    }));
}
