import { personas } from '@prisma/client';

export default profile;

// const F = f(__filename);

/**
 * Get profile info
 * @param {string} memberId The user to either set or get the timezone!
 * @return {any[]} an object with information about the bot
 */
export async function profile(
  memberId: string,
):Promise<ProfileData> {
  const userData = await db.users.upsert({
    where: {
      discord_id: memberId,
    },
    create: {
      discord_id: memberId,
    },
    update: {},
  });
  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  const values = await Promise.allSettled([
    await db.user_experience.findMany({
      where: {
        user_id: userData.id,
      },
    }),
    await db.personas.findFirst({
      where: {
        user_id: userData.id,
      },
    }),
  ]);

  // log.debug(F, `values: ${JSON.stringify(values, null, 2)} `);

  const expData = values[0].status === 'fulfilled' ? values[0].value : [];
  const personaData = values[1].status === 'fulfilled' ? values[1].value : {} as personas;

  // log.debug(F, `expData: ${JSON.stringify(expData, null, 2)}`);
  // log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);

  // Sum up every experience point as long as the type isn't ignored or total
  const totalTextExp = expData
    .filter(exp => exp.type === 'TEXT' && exp.category !== 'TOTAL' && exp.category !== 'IGNORED')
    .reduce((acc, exp) => acc + exp.total_points, 0);

  const totalVoiceExp = expData
    .filter(exp => exp.type === 'VOICE' && exp.category !== 'TOTAL' && exp.category !== 'IGNORED')
    .reduce((acc, exp) => acc + exp.total_points, 0);

  let tokens = 0;
  if (personaData) {
    tokens = personaData.tokens;
  }

  // log.info(F, `response: ${JSON.stringify(profileData, null, 2)}`);
  return {
    birthday: userData.birthday,
    timezone: userData.timezone,
    karma_given: userData.karma_given ?? 0,
    karma_received: userData.karma_received ?? 0,
    totalTextExp,
    totalVoiceExp,
    tokens,
  };
}

export type ProfileData = {
  birthday: Date | null,
  timezone: string | null,
  karma_given: number,
  karma_received: number,
  totalTextExp: number,
  totalVoiceExp: number,
  tokens: number,
};
