import {db} from '../../global/utils/knex';
import {DateTime} from 'luxon';
import {
  Users,
  UserDoseHistory,
  DrugNames,
} from '../../global/@types/pgdb.d';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @param {'get' | 'set' | 'delete'} command
 * @param {number | null} recordNumber
 * @param {string} userId
 * @param {string | null} substance
 * @param {number | null} volume
 * @param {string | null} units
 * @param {string | null} roa
 * @param {Date | null} date
 * @return {any}
 */
export async function idose(
  command: 'get' | 'set' | 'delete',
  recordNumber: number | null,
  userId: string,
  substance: string | null,
  volume: number | null,
  units: string | null,
  roa: string | null,
  date: Date | null,
):Promise<any> {
  logger.debug(`[${PREFIX}] Starting!`);

  logger.debug(`[${PREFIX}] 
    command: ${command}
    recordNumber: ${recordNumber}
    userId: ${userId}
    volume: ${volume} 
    units: ${units} 
    substance: ${substance} 
    roa: ${roa} 
    date: ${date}
  `);

  if (command === 'delete') {
    if (recordNumber === null) {
      return 'You must provide a record number to delete!';
    }
    logger.debug(`[${PREFIX}] Deleting record ${recordNumber}`);

    const userUniqueId = (await db
      .select(db.ref('id'))
      .from<Users>('users')
      .where('discord_id', userId))[0].id;

    const unsorteddata = await db
      .select(
        db.ref('id').as('id'),
        db.ref('user_id').as('user_id'),
        db.ref('route').as('route'),
        db.ref('dose').as('dose'),
        db.ref('units').as('units'),
        db.ref('drug_id').as('drug_id'),
        db.ref('dose_date').as('dose_date'),
      )
      .from<UserDoseHistory>('user_dose_history')
      .where('user_id', userUniqueId);

    if (unsorteddata.length === 0) {
      return 'You have no dose records, you can use /idose to add some!';
    }

    // Sort data based on the dose_date property
    const data = unsorteddata.sort((a, b) => {
      if (a.dose_date < b.dose_date) {
        return -1;
      }
      if (a.dose_date > b.dose_date) {
        return 1;
      }
      return 0;
    });

    const record = data[recordNumber];
    if (record === undefined) {
      return 'That record does not exist!';
    }
    const recordId = record.id;
    const doseDate = data[recordNumber].dose_date.toISOString();
    // logger.debug(`[${PREFIX}] doseDate: ${doseDate}`);
    const timeVal = DateTime.fromISO(doseDate);
    const drugId = record.drug_id;
    const drugName = (await db
      .select(db.ref('name').as('name'))
      .from<DrugNames>('drug_names')
      .where('drug_id', drugId)
      .andWhere('is_default', true))[0].name;
    const route = record.route.charAt(0).toUpperCase() + record.route.slice(1).toLowerCase();

    logger.debug(`[${PREFIX}] I deleted:
      (${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}
      ${record.dose} ${record.units} of ${drugName} ${route}
      `);

    await db
      .from<UserDoseHistory>('user_dose_history')
      .where('id', recordId)
      .del();

    return `I deleted:
      > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
      > ${record.dose} ${record.units} of ${drugName} ${route}
      `;
  }
  if (command === 'get') {
    const userUniqueId = (await db
      .select(db.ref('id'))
      .from<Users>('users')
      .where('discord_id', userId))[0].id;

    logger.debug(`[${PREFIX}] userUniqueId: ${userUniqueId}`);

    const unsorteddata = await db
      .select(
        db.ref('id').as('id'),
        db.ref('user_id').as('user_id'),
        db.ref('route').as('route'),
        db.ref('dose').as('dose'),
        db.ref('units').as('units'),
        db.ref('drug_id').as('drug_id'),
        db.ref('dose_date').as('dose_date'),
      )
      .from<UserDoseHistory>('user_dose_history')
      .where('user_id', userUniqueId);

    logger.debug(`[${PREFIX}] Data: ${JSON.stringify(unsorteddata, null, 2)}`);

    logger.debug(`[${PREFIX}] unsorteddata: ${unsorteddata.length}`);

    if (unsorteddata !== null && unsorteddata.length > 0) {
      // Sort data based on the dose_date property
      const data = unsorteddata.sort((a, b) => {
        if (a.dose_date < b.dose_date) {
          return -1;
        }
        if (a.dose_date > b.dose_date) {
          return 1;
        }
        return 0;
      });

      logger.debug(`[${PREFIX}] Sorted ${data.length} items!`);

      const doses = [] as {
        name: string,
        value: string,
        inline: boolean,
      }[];

      for (let i = 0; i < data.length; i += 1) {
        const dose = data[i];
        const doseDate = data[i].dose_date.toISOString();
        logger.debug(`[${PREFIX}] doseDate: ${doseDate}`);
        const timeVal = DateTime.fromISO(doseDate);
        const drugId = dose.drug_id;
        const drugName = (await db
          .select(db.ref('name').as('name'))
          .from<DrugNames>('drug_names')
          .where('drug_id', drugId)
          .andWhere('is_default', true))[0].name;

        // Lowercase everything but the first letter
        const route = dose.route.charAt(0).toUpperCase() + dose.route.slice(1).toLowerCase();
        const field = {
          name: `(${i}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}`,
          value: `${dose.dose} ${dose.units} of ${drugName} ${route}`,
          inline: true,
        };
        doses.push(field);
      }
      return doses;
    } else {
      return false;
    }
  }
  if (command === 'set') {
    if (substance === null || volume === null || units === null || roa === null) {
      return 'You must provide a substance, volume, units, and route of administration!';
    }

    let userUniqueId = (await db
      .select(db.ref('id'))
      .from<Users>('users')
      .where('discord_id', userId))[0].id;

    if (userId.length === 0) {
      logger.debug(`[${PREFIX}] discord_id = ${userId} not found in 'users', creating new`);
      await db('users')
        .insert({
          discord_id: userId,
        });
      userUniqueId = (await db
        .select(db.ref('id'))
        .from<Users>('users')
        .where('discord_id', userId))[0].id;
    }

    logger.debug(`[${PREFIX}] userUniqueId: ${userUniqueId}`);

    const drugId = (await db
      .select(db.ref('drug_id'))
      .from<DrugNames>('drug_names')
      .where('name', substance)
      .orWhere('name', substance.toLowerCase())
      .orWhere('name', substance.toUpperCase()))[0].drug_id;

    if (drugId.length === 0) {
      logger.debug(`name = ${substance} not found in 'drugNames'`);
    }

    logger.debug(`[${PREFIX}] drugId: ${drugId}`);

    await db('user_dose_history')
      .insert({
        user_id: userUniqueId,
        dose: volume,
        route: roa,
        units: units,
        drug_id: drugId,
        dose_date: date,
      });
  }
}
