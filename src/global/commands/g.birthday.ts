import { DateTime } from 'luxon';

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
    const birthDate = DateTime.local(2000, month as number, day as number);

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
      const birthDate = DateTime.fromJSDate(birthDateRaw);
      response = birthDate;
    } else {
      response = null;
    }
  }
  log.debug(F, `${command} for ${memberId}: ${response?.toISODate() ?? 'null'}`);

  return response;
}
