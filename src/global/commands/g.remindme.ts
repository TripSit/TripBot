import { DateTime } from 'luxon';

const F = f(__filename);

export default remindMe;

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
  command: 'get' | 'set' | 'delete',
  userId: string,
  recordNumber: number | null,
  reminderText: string | null,
  triggerAt: Date | null,
):Promise<string | Reminder[]> {
  // log.debug(`[${PREFIX}]
  //   command: ${command}
  //   userId: ${userId}
  //   recordNumber: ${recordNumber}
  //   reminderText: ${reminderText}
  //   triggerAt: ${triggerAt}
  // `);

  let response = '' as string | Reminder[];

  if (command === 'delete') {
    if (recordNumber === null) {
      response = 'You must provide a record number to delete!';
      log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }
    // log.debug(F, `Deleting record ${recordNumber}`);

    const userData = await db.users.upsert({
      where: {
        discord_id: userId,
      },
      create: {
        discord_id: userId,
      },
      update: {},
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
    const timeVal = DateTime.fromISO(reminderDate);

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
      > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
      > ${record.reminder_text}
      `;
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  }
  if (command === 'get') {
    const userData = await db.users.upsert({
      where: {
        discord_id: userId,
      },
      create: {
        discord_id: userId,
      },
      update: {},
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

    for (let i = 0; i < data.length; i += 1) {
      const reminder = data[i];
      const reminderDate = data[i].trigger_at;

      // Lowercase everything but the first letter
      const field = {
        index: i,
        date: reminderDate,
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
      where: {
        discord_id: userId,
      },
      create: {
        discord_id: userId,
      },
      update: {},
    });

    await db.user_reminders.create({
      data: {
        user_id: userData.id,
        reminder_text: reminderText,
        trigger_at: triggerAt,
      },
    });

    response = `I will remind you to ${reminderText} at ${triggerAt}!`;
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  }
  return response;
}

type Reminder = {
  index: number,
  date: Date,
  value: string,
};
