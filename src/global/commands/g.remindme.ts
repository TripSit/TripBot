import { DateTime } from 'luxon';

const F = f(__filename);

export default remindMe;

interface Reminder {
  date: Date;
  index: number;
  value: string;
}

/**
 *
 * @param {'get' | 'set' | 'delete'} command
 * @param {string} userId
 * @param {number | null} recordNumber
 * @param {string | null} reminderText
 * @param {Date | null} triggerAt
 * @return {any}
 */
export async function remindMe(
  command: 'delete' | 'get' | 'set',
  userId: string,
  recordNumber: null | number,
  reminderText: null | string,
  triggerAt: Date | null,
): Promise<Reminder[] | string> {
  // log.debug(`[${PREFIX}]
  //   command: ${command}
  //   userId: ${userId}
  //   recordNumber: ${recordNumber}
  //   reminderText: ${reminderText}
  //   triggerAt: ${triggerAt}
  // `);

  let response = '' as Reminder[] | string;

  if (command === 'delete') {
    if (recordNumber === null) {
      response = 'You must provide a record number to delete!';
      log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }
    // log.debug(F, `Deleting record ${recordNumber}`);

    const userData = await db.users.upsert({
      create: {
        discord_id: userId,
      },
      update: {},
      where: {
        discord_id: userId,
      },
    });

    const unsortedData = await db.user_reminders.findMany({
      where: {
        user_id: userData.id,
      },
    });

    if (unsortedData.length === 0) {
      response = 'You have no reminder records, you can use /remind_me to add some!';
      log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }

    // Sort data based on the created_at property
    const data = [...unsortedData].sort((a, b) => {
      if (a.created_at < b.created_at) {
        return -1;
      }
      if (a.created_at > b.created_at) {
        return 1;
      }
      return 0;
    });

    const record = data[recordNumber];
    if (record === undefined || record === null) {
      response = 'That record does not exist!';
      log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }
    const recordId = record.id;
    const reminderDate = data[recordNumber].created_at.toISOString();
    // log.debug(F, `reminderDate: ${reminderDate}`);
    const timeValue = DateTime.fromISO(reminderDate);

    // log.debug(F, `I deleted:
    // (${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}
    // ${record.reminder_text}
    // `);

    await db.user_reminders.delete({
      where: {
        id: recordId,
      },
    });

    response = `I deleted:
      > **(${recordNumber}) ${timeValue.monthShort} ${timeValue.day} ${timeValue.year} ${timeValue.hour}:${timeValue.minute}**
      > ${record.reminder_text}
      `;
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  }
  if (command === 'get') {
    const userData = await db.users.upsert({
      create: {
        discord_id: userId,
      },
      update: {},
      where: {
        discord_id: userId,
      },
    });

    const unsortedData = await db.user_reminders.findMany({
      where: {
        user_id: userData.id,
      },
    });

    // log.debug(F, `Data: ${JSON.stringify(unsortedData, null, 2)}`);

    // log.debug(F, `unsortedData: ${unsortedData.length}`);

    if (unsortedData.length === 0) {
      response = 'You have no reminder records, you can use /remind_me to add some!';
      log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }

    // Sort data based on the trigger_at property
    const data = [...unsortedData].sort((a, b) => {
      if (a.trigger_at < b.trigger_at) {
        return -1;
      }
      if (a.trigger_at > b.trigger_at) {
        return 1;
      }
      return 0;
    });

    // log.debug(F, `Sorted ${data.length} items!`);

    const reminders = [] as Reminder[];

    for (const [index, reminder] of data.entries()) {
      const reminderDate = reminder.trigger_at;

      // Lowercase everything but the first letter
      const field = {
        date: reminderDate,
        index: index,
        value: `${reminder.reminder_text}`,
      };
      reminders.push(field);
    }
    log.info(F, `response: ${JSON.stringify(reminders, null, 2)}`);
    response = reminders;
  }
  if (command === 'set') {
    if (!triggerAt) {
      response = 'You must provide a date and time for the reminder!';
      log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }
    const userData = await db.users.upsert({
      create: {
        discord_id: userId,
      },
      update: {},
      where: {
        discord_id: userId,
      },
    });

    await db.user_reminders.create({
      data: {
        reminder_text: reminderText,
        trigger_at: triggerAt,
        user_id: userData.id,
      },
    });

    response = `I will remind you to ${reminderText} at ${triggerAt}!`;
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  }
  return response;
}
