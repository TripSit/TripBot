import {db, getUser} from '../../global/utils/knex';
import {DateTime} from 'luxon';
import {
  UserDrugDoses,
  DrugNames,
  DrugRoa,
  DrugUnit,
} from '../../global/@types/pgdb.d';
import log from '../utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @param {'get' | 'set' | 'delete'} command
 * @param {number | null} recordNumber
 * @param {string} userId
 * @param {string | null} substance
 * @param {number | null} volume
 * @param {DrugUnit | null} units
 * @param {DrugRoa | null} roa
 * @param {Date | null} date
 * @return {any}
 */
export async function idose(
  command: 'get' | 'set' | 'delete',
  recordNumber: number | null,
  userId: string,
  substance: string | null,
  volume: number | null,
  units: DrugUnit | null,
  roa: DrugRoa | null,
  date: Date | null,
):Promise<{
    name: string,
    value: string,
  }[]> {
  log.debug(`[${PREFIX}] Starting!`);

  log.debug(`[${PREFIX}] 
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
      return [{
        name: 'Error',
        value: 'You must provide a record number to delete!',
      }];
    }
    log.debug(`[${PREFIX}] Deleting record ${recordNumber}`);

    const userData = await getUser(userId, null);

    const unsorteddata = await db<UserDrugDoses>('user_drug_doses')
      .select('*')
      .where('user_id', userData.id);

    if (unsorteddata.length === 0) {
      return [{
        name: 'Error',
        value: 'You have no dose records, you can use /idose to add some!',
      }];
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
      return [{
        name: 'Error',
        value: `That record does not exist!`,
      }];
    } else {
      const recordId = record.id;
      const doseDate = data[recordNumber].created_at.toISOString();
      // log.debug(`[${PREFIX}] doseDate: ${doseDate}`);
      const timeVal = DateTime.fromISO(doseDate);
      const drugId = record.drug_id;
      const drugName = (await db<DrugNames>('drug_names')
        .select('*')
        .where('drug_id', drugId)
        .andWhere('is_default', true))[0].name;
      const route = record.route.charAt(0).toUpperCase() + record.route.slice(1).toLowerCase();

      log.debug(`[${PREFIX}] I deleted:
      (${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}
      ${record.dose} ${record.units} of ${drugName} ${route}
      `);

      await db<UserDrugDoses>('user_drug_doses')
        .where('id', recordId)
        .del();

      return [{
        name: 'Success',
        value: `I deleted:
        > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
        > ${record.dose} ${record.units} of ${drugName} ${route}
        `,
      }];
      ;
    }
  }
  if (command === 'get') {
    const userData = await getUser(userId, null);

    const unsorteddata = await db<UserDrugDoses>('user_drug_doses')
      .select('*')
      .where('user_id', userData);

    log.debug(`[${PREFIX}] Data: ${JSON.stringify(unsorteddata, null, 2)}`);

    log.debug(`[${PREFIX}] unsorteddata: ${unsorteddata.length}`);

    if (unsorteddata !== null && unsorteddata.length > 0) {
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

      log.debug(`[${PREFIX}] Sorted ${data.length} items!`);

      const doses = [] as {
        name: string,
        value: string,
        inline: boolean,
      }[];

      for (let i = 0; i < data.length; i += 1) {
        const dose = data[i];
        const doseDate = data[i].created_at.toISOString();
        log.debug(`[${PREFIX}] doseDate: ${doseDate}`);
        const timeVal = DateTime.fromISO(doseDate);
        const drugId = dose.drug_id;
        const drugName = (await db<DrugNames>('drug_names')
          .select('*')
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
      return [{
        name: 'Error',
        value: 'You have no dose records, you can use /idose to add some!',
      }];
    }
  }
  if (command === 'set') {
    if (substance === null || volume === null || units === null || roa === null) {
      return [{
        name: 'Error',
        value: 'You must provide a substance, volume, units, and route of administration!',
      }];
    }
    if (!date) {
      return [{
        name: 'Error',
        value: 'You must provide a date!',
      }];
    }

    const userData = await getUser(userId, null);

    const drugId = (await db<DrugNames>('drug_names')
      .select('*')
      .where('name', substance)
      .orWhere('name', substance.toLowerCase())
      .orWhere('name', substance.toUpperCase()))[0].drug_id;

    if (drugId.length === 0) {
      log.debug(`name = ${substance} not found in 'drugNames'`);
    }

    log.debug(`[${PREFIX}] drugId: ${drugId}`);

    await db<UserDrugDoses>('user_drug_doses')
      .insert({
        user_id: userData.id,
        drug_id: drugId,
        route: roa,
        dose: volume,
        units: units,
        created_at: date,
      });
  }
  return [{
    name: 'Error',
    value: 'End of function i guess?',
  }];
}
