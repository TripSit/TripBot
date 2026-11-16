import { DateTime } from 'luxon';
import { getOrCreateUser } from '../utils/dbRecords';

const F = f(__filename);

export default remindMe;

type ReminderRow = { id: string, trigger_at: Date, created_at: Date };

/**
 * The one order shared by `get` and `delete`, so the number shown in the list is the number that gets deleted.
 * Soonest trigger first, with creation time and then id breaking ties so the order is deterministic.
 */
function sortByTrigger<T extends ReminderRow>(reminders: T[]): T[] {
  return [...reminders].sort((a, b) => a.trigger_at.getTime() - b.trigger_at.getTime()
    || a.created_at.getTime() - b.created_at.getTime()
    || a.id.localeCompare(b.id));
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
  command: 'get' | 'set' | 'delete',
  userId: string,
  recordNumber: number | null,
  reminderText: string | null,
  triggerAt: Date | null,
):Promise<string | Reminder[]> {
  let response = '' as string | Reminder[];

  if (command === 'delete') {
    if (recordNumber === null) {
      response = 'You must provide a record number to delete!';
      return response;
    }

    const userData = await getOrCreateUser(userId);

    const unsortedData = await db.user_reminders.findMany({
      where: {
        user_id: userData.id,
      },
    });

    if (unsortedData.length === 0) {
      response = 'You have no reminder records, you can use /remind_me to add some!';
      return response;
    }

    // Same order as `get`, so the number the user saw in the list is the one that gets deleted
    const data = sortByTrigger(unsortedData);

    const record = data[recordNumber];
    if (record === undefined || record === null) {
      response = 'That record does not exist!';
      return response;
    }
    const recordId = record.id;
    const reminderDate = record.trigger_at.toISOString();
    const timeVal = DateTime.fromISO(reminderDate);

    await db.user_reminders.delete({
      where: {
        id: recordId,
      },
    });

    log.debug(F, `remindMe: deleted reminder ${recordId} for user ${userData.id}`);

    response = `I deleted:
      > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
      > ${record.reminder_text}
      `;
  }
  if (command === 'get') {
    const userData = await getOrCreateUser(userId);

    const unsortedData = await db.user_reminders.findMany({
      where: {
        user_id: userData.id,
      },
    });

    if (unsortedData.length === 0) {
      response = 'You have no reminder records, you can use /remind_me to add some!';
      return response;
    }

    const data = sortByTrigger(unsortedData);

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
    log.debug(F, `remindMe: fetched ${reminders.length} reminders for user ${userData.id}`);
    response = reminders;
  }
  if (command === 'set') {
    if (!triggerAt) {
      response = 'You must provide a date and time for the reminder!';
      return response;
    }
    const userData = await getOrCreateUser(userId);

    await db.user_reminders.create({
      data: {
        user_id: userData.id,
        reminder_text: reminderText,
        trigger_at: triggerAt,
      },
    });

    log.debug(F, `remindMe: created reminder for user ${userData.id} at ${triggerAt}`);

    response = `I will remind you to ${reminderText} at ${triggerAt}!`;
  }
  return response;
}

type Reminder = {
  index: number,
  date: Date,
  value: string,
};
