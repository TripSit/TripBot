import { personas } from '@db/tripbot';

export default profile;

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

  const expData = values[0].status === 'fulfilled' ? values[0].value : [];
  const personaData = values[1].status === 'fulfilled' ? values[1].value : {} as personas;

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
