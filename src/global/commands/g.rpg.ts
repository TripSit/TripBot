import type { personas } from '@prisma/client';

const F = f(__filename); // eslint-disable-line

export async function getPersonaInfo(discordId: string): Promise<personas> {
  const userData = await db.users.upsert({
    create: {
      discord_id: discordId,
    },
    update: {},
    where: {
      discord_id: discordId,
    },
  });
  return db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
}

export async function setPersonaInfo(personaData: personas): Promise<personas> {
  return db.personas.upsert({
    create: personaData,
    update: personaData,
    where: {
      id: personaData.id,
    },
  });
}
