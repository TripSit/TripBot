import { personas } from '@db/tripbot';
import { getOrCreatePersona, getOrCreateUser } from '../utils/dbRecords';

const F = f(__filename);

export async function getPersonaInfo(
  discordId: string,
):Promise<personas> {
  const userData = await getOrCreateUser(discordId);
  return getOrCreatePersona(userData.id);
}

export async function setPersonaInfo(
  personaData: personas,
):Promise<personas> {
  log.debug(F, `setPersonaInfo: updating persona ${personaData.id}`);
  return db.personas.upsert({
    where: {
      id: personaData.id,
    },
    create: personaData,
    update: personaData,
  });
}
