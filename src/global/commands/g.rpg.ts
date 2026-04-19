import { personas } from '@db/tripbot';

const F = f(__filename); // eslint-disable-line

export async function getPersonaInfo(
  discordId: string,
):Promise<personas> {
  const userData = await db.users.upsert({
    where: {
      discord_id: discordId,
    },
    create: {
      discord_id: discordId,
    },
    update: {},
  });
  return db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
}

export async function setPersonaInfo(
  personaData: personas,
):Promise<personas> {
  return db.personas.upsert({
    where: {
      id: personaData.id,
    },
    create: personaData,
    update: personaData,
  });
}
