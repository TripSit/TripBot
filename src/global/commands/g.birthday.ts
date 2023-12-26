import { DateTime } from 'luxon';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['error'] });

const F = f(__filename);

export default birthday;

/**
 * Birthday information of a user
 * @param {'get' | 'set'} command
 * @param {GuildMember} memberId
 * @param {string} month The birthday month
 * @param {number} day The birthday day
 * @return {string} an object with information about the bot
 */
export async function birthday(
  command: 'get' | 'set',
  memberId: string,
  month?: number | null,
  day?: number | null,
):Promise<DateTime | null> {
  let response = {} as DateTime | null;
  if (command === 'set') {
    // log.debug(F, `${command} ${memberId} ${month} ${day}`);
    const birthDate = DateTime.local(2000, month as number, day as number);

    // log.debug(F, `Setting birthDate for ${memberId} to ${birthDate}`);

    await db.users.upsert({
      where: {
        discord_id: memberId,
      },
      create: {
        discord_id: memberId,
        birthday: birthDate.toJSDate(),
      },
      update: {
        birthday: birthDate.toJSDate(),
      },
    });

    response = birthDate;
  } else if (command === 'get') {
    const userData = await db.users.upsert({
      where: {
        discord_id: memberId,
      },
      create: {
        discord_id: memberId,
      },
      update: {},
    });
    if (userData.birthday !== null) {
      const birthDateRaw = userData.birthday;
      // log.debug(F, `birthDate: ${birthDate}`);
      const birthDate = DateTime.fromJSDate(birthDateRaw);
      // log.debug(F, `birthday: ${birthday}`);
      response = birthDate;
    } else {
      // log.debug(F, `birthday is NULL`);
      response = null;
    }
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  log.info(F, `response: ${JSON.stringify(response?.toJSDate().toString(), null, 2)}`);

  return response;
}
