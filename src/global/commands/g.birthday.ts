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
  month?: null | number,
  day?: null | number,
): Promise<DateTime | null> {
  let response = {} as DateTime | null;
  if (command === 'set') {
    // log.debug(F, `${command} ${memberId} ${month} ${day}`);
    const birthDate = DateTime.local(2000, month!, day!);

    // log.debug(F, `Setting birthDate for ${memberId} to ${birthDate}`);

    await db.users.upsert({
      create: {
        birthday: birthDate.toJSDate(),
        discord_id: memberId,
      },
      update: {
        birthday: birthDate.toJSDate(),
      },
      where: {
        discord_id: memberId,
      },
    });

    response = birthDate;
  } else if (command === 'get') {
    const userData = await db.users.upsert({
      create: {
        discord_id: memberId,
      },
      update: {},
      where: {
        discord_id: memberId,
      },
    });
    if (userData.birthday === null) {
      // log.debug(F, `birthday is NULL`);
      response = null;
    } else {
      const birthDateRaw = userData.birthday;
      // log.debug(F, `birthDate: ${birthDate}`);
      const birthDate = DateTime.fromJSDate(birthDateRaw);
      // log.debug(F, `birthday: ${birthday}`);
      response = birthDate;
    }
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  log.info(F, `response: ${JSON.stringify(response?.toJSDate().toString(), null, 2)}`);

  return response;
}
