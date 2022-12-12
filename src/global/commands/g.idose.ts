import {
  time,
} from 'discord.js';
import { DateTime } from 'luxon';
import { db, getUser } from '../utils/knex';
import {
  UserDrugDoses,
  DrugNames,
  DrugRoa,
  DrugMassUnit,
} from '../@types/pgdb.d';

const F = f(__filename);

export default idose;

/**
 *
 * @param {'get' | 'set' | 'delete'} command
 * @param {number | null} recordNumber
 * @param {string} userId
 * @param {string | null} substance
 * @param {number | null} volume
 * @param {DrugMassUnit | null} units
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
  units: DrugMassUnit | null,
  roa: DrugRoa | null,
  date: Date | null,
):Promise<{
    name: string,
    value: string,
  }[]> {
  let response = {} as {
    name: string,
    value: string,
  }[];
  if (command === 'delete') {
    if (recordNumber === null) {
      return [{
        name: 'Error',
        value: 'You must provide a record number to delete!',
      }];
    }
    // log.debug(F, `Deleting record ${recordNumber}`);

    const userData = await getUser(userId, null);

    const unsorteddata = await db<UserDrugDoses>('user_drug_doses')
      .select(
        db.ref('id'),
        db.ref('drug_id'),
        db.ref('dose'),
        db.ref('units'),
        db.ref('route'),
        db.ref('created_at'),
      )
      .where('user_id', userData.id);

    if (unsorteddata.length === 0) {
      return [{
        name: 'Error',
        value: 'You have no dose records, you can use /idose to add some!',
      }];
    }

    // Sort data based on the created_at property
    const data = [...unsorteddata].sort((a, b) => {
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
        value: 'That record does not exist!',
      }];
    }
    const recordId = record.id;
    const doseDate = data[recordNumber].created_at.toISOString();
    // log.debug(F, `doseDate: ${doseDate}`);
    const timeVal = DateTime.fromISO(doseDate);
    const drugId = record.drug_id;
    const drugName = (await db<DrugNames>('drug_names')
      .select(db.ref('name'))
      .where('drug_id', drugId)
      .andWhere('is_default', true))[0].name;
    const route = record.route.charAt(0).toUpperCase() + record.route.slice(1).toLowerCase();

    // log.debug(F, `I deleted:
    // (${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}
    // ${record.dose} ${record.units} of ${drugName} ${route}
    // `);

    await db<UserDrugDoses>('user_drug_doses')
      .where('id', recordId)
      .del();

    response = [{
      name: 'Success',
      value: `I deleted:
        > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
        > ${record.dose} ${record.units} of ${drugName} ${route}
        `,
    }];
  }
  if (command === 'get') {
    const userData = await getUser(userId, null);

    // log.debug(F, `Getting data for ${userData.id}...`);

    const unsorteddata = await db<UserDrugDoses>('user_drug_doses')
      .select(
        db.ref('id'),
        db.ref('drug_id'),
        db.ref('dose'),
        db.ref('units'),
        db.ref('route'),
        db.ref('created_at'),
      )
      .where('user_id', userData.id);

    if (!unsorteddata) {
      return [{
        name: 'Error',
        value: 'You have no dose records, you can use /idose to add some!',
      }];
    }

    // log.debug(F, `Data: ${JSON.stringify(unsorteddata, null, 2)}`);

    // Sort data based on the created_at property
    const data = [...unsorteddata].sort((a, b) => {
      if (a.created_at < b.created_at) {
        return -1;
      }
      if (a.created_at > b.created_at) {
        return 1;
      }
      return 0;
    });

    // log.debug(F, `Sorted ${data.length} items!`);

    const doses = [] as {
      name: string,
      value: string,
      inline: boolean,
    }[];

    for (let i = 0; i < data.length; i += 1) {
      const dose = data[i];
      const doseDate = data[i].created_at.toISOString();
      // log.debug(F, `doseDate: ${doseDate}`);
      const timeVal = DateTime.fromISO(doseDate);
      const drugId = dose.drug_id;
      const drugName = (await db<DrugNames>('drug_names') // eslint-disable-line no-await-in-loop
        .select(db.ref('name'))
        .where('drug_id', drugId)
        .andWhere('is_default', true))[0].name;

      // Lowercase everything but the first letter
      const route = dose.route.charAt(0).toUpperCase() + dose.route.slice(1).toLowerCase();

      const relative = time(new Date(timeVal.toJSDate()), 'R');
      // Capitalize the first letter, lower the rest
      const routeStr = route.charAt(0).toUpperCase() + route.slice(1).toLowerCase();
      const field = {
        name: `(${i}) ${relative}`,
        value: `${dose.dose} ${dose.units} of ${drugName} ${routeStr}`,
        inline: true,
      };
      doses.push(field);
    }
    response = doses;
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

    // log.debug(F, `Substance: ${substance}`);

    const data = await db<DrugNames>('drug_names')
      .select(db.ref('drug_id'))
      .where('name', substance)
      .orWhere('name', substance.toLowerCase())
      .orWhere('name', substance.toUpperCase());

    // log.debug(F, `Data: ${JSON.stringify(data, null, 2)}`);

    if (data.length === 0) {
      // log.debug(`name = ${substance} not found in 'drugNames'`);
    }

    const drugId = data[0].drug_id;

    // log.debug(F, `drugId: ${drugId}`);

    const userData = await getUser(userId, null);
    await db<UserDrugDoses>('user_drug_doses')
      .insert({
        user_id: userData.id,
        drug_id: drugId,
        route: roa,
        dose: volume,
        units,
        created_at: date,
      });
    response = [{
      name: 'Success',
      value: 'I added a new value for you!',
    }];
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
