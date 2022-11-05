import {db, getUser} from '../utils/knex';
import {DateTime} from 'luxon';
import {
  UserDrugDoses,
  UserReminders,
} from '../@types/pgdb';
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 *
 * @param {'get' | 'set' | 'delete'} command
 * @param {string} userId
 * @param {number | null} recordNumber
 * @param {string | null} reminderText
 * @param {Date | null} triggerAt
 * @return {any}
 */
export async function remindme(
  command: 'get' | 'set' | 'delete',
  userId: string,
  recordNumber: number | null,
  reminderText: string | null,
  triggerAt: Date | null,
):Promise<any> {
  log.debug(`[${PREFIX}] Starting!`);

  log.debug(`[${PREFIX}] 
    command: ${command}
    userId: ${userId}
    recordNumber: ${recordNumber}
    reminderText: ${reminderText}
    triggerAt: ${triggerAt} 
  `);

  if (command === 'delete') {
    if (recordNumber === null) {
      const response = 'You must provide a record number to delete!';
      log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }
    log.debug(`[${PREFIX}] Deleting record ${recordNumber}`);

    const userData = await getUser(userId, null);

    const unsorteddata = await db<UserReminders>('user_reminders')
      .select(
        db.ref('id'),
        db.ref('created_at'),
        db.ref('reminder_text'),
      )
      .where('user_id', userData.id);

    if (unsorteddata.length === 0) {
      const response = 'You have no reminder records, you can use /remindme to add some!';
      log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }

    // Sort data based on the created_at property
    const data = unsorteddata.sort((a, b) => {
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
      const response = 'That record does not exist!';
      log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
      return response;
    } else {
      const recordId = record.id;
      const reminderDate = data[recordNumber].created_at.toISOString();
      // log.debug(`[${PREFIX}] reminderDate: ${reminderDate}`);
      const timeVal = DateTime.fromISO(reminderDate);

      log.debug(`[${PREFIX}] I deleted:
      (${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}
      ${record.reminder_text}
      `);

      await db<UserDrugDoses>('user_drug_doses')
        .where('id', recordId)
        .del();

      const response = `I deleted:
      > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
      > ${record.reminder_text}
      `;
      log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }
  }
  if (command === 'get') {
    const userData = await getUser(userId, null);

    const unsorteddata = await db<UserReminders>('user_reminders')
      .select(
        db.ref('trigger_at'),
        db.ref('reminder_text'),
      )
      .where('user_id', userData.id);

    log.debug(`[${PREFIX}] Data: ${JSON.stringify(unsorteddata, null, 2)}`);

    log.debug(`[${PREFIX}] unsorteddata: ${unsorteddata.length}`);

    if (unsorteddata !== null && unsorteddata.length > 0) {
      // Sort data based on the trigger_at property
      const data = unsorteddata.sort((a, b) => {
        if (a.trigger_at < b.trigger_at) {
          return -1;
        }
        if (a.trigger_at > b.trigger_at) {
          return 1;
        }
        return 0;
      });

      log.debug(`[${PREFIX}] Sorted ${data.length} items!`);

      const reminders = [] as {
        index: number,
        date: Date,
        value: string,
      }[];

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
      log.info(`[${PREFIX}] response: ${JSON.stringify(reminders, null, 2)}`);
      return reminders;
    } else {
      return false;
    }
  }
  if (command === 'set') {
    if (!triggerAt) {
      const response = 'You must provide a date and time for the reminder!';
      log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
      return response;
    }
    const userData = await getUser(userId, null);
    await db<UserReminders>('user_reminders')
      .insert({
        user_id: userData.id,
        reminder_text: reminderText,
        trigger_at: triggerAt,
      });
    const response = `I will remind you to ${reminderText} at ${triggerAt}!`;
    log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
    return response;
  }
}
