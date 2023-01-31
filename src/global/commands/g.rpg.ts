import { Personas } from '../@types/pgdb';
import { getUser, personaGet, personaSet } from '../utils/knex';

const F = f(__filename); // eslint-disable-line

export async function getPersonaInfo(
  discordId: string,
):Promise<Personas[]> {
  const userData = await getUser(discordId, null);

  return personaGet(userData.id);
}

export async function setPersonaInfo(
  personaData: Personas,
):Promise<void> {
  return personaSet(personaData);
}
