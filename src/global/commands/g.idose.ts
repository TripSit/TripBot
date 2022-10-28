import {db} from '../../global/utils/knex';
import {DateTime} from 'luxon';
import {
  Users,
  UserDrugDoses,
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
        db.ref('drug_id').as('drug_id'),
        db.ref('route').as('route'),
        db.ref('dose').as('dose'),
        db.ref('units').as('units'),
        db.ref('created_at').as('created_at'),
      )
      .from<UserDrugDoses>('user_drug_doses')
      .where('user_id', userUniqueId);

    if (unsorteddata.length === 0) {
      return 'You have no dose records, you can use /idose to add some!';
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
      return 'That record does not exist!';
    } else {
      const recordId = record.id;
      const doseDate = data[recordNumber].created_at.toISOString();
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
        .from<UserDrugDoses>('user_drug_doses')
        .where('id', recordId)
        .del();

      return `I deleted:
      > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
      > ${record.dose} ${record.units} of ${drugName} ${route}
      `;
    }
  }
  if (command === 'get') {
    const data = await db
      .select(db.ref('id'))
      .from<Users>('users')
      .where('discord_id', userId);

    logger.debug(`[${PREFIX}] data: ${JSON.stringify(data)}`);

    if (data.length === 0) {
      return false;
    }

    const userUniqueId = data[0].id;

    logger.debug(`[${PREFIX}] userUniqueId: ${userUniqueId}`);

    const unsorteddata = await db
      .select(
        db.ref('id').as('id'),
        db.ref('user_id').as('user_id'),
        db.ref('drug_id').as('drug_id'),
        db.ref('route').as('route'),
        db.ref('dose').as('dose'),
        db.ref('units').as('units'),
        db.ref('created_at').as('created_at'),
      )
      .from<UserDrugDoses>('user_drug_doses')
      .where('user_id', userUniqueId);

    logger.debug(`[${PREFIX}] Data: ${JSON.stringify(unsorteddata, null, 2)}`);

    logger.debug(`[${PREFIX}] unsorteddata: ${unsorteddata.length}`);

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

      logger.debug(`[${PREFIX}] Sorted ${data.length} items!`);

      const doses = [] as {
        name: string,
        value: string,
        inline: boolean,
      }[];

      for (let i = 0; i < data.length; i += 1) {
        const dose = data[i];
        const doseDate = data[i].created_at.toISOString();
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
    const data = await db
      .select(db.ref('id'))
      .from<Users>('users')
      .where('discord_id', userId);

    const userUniqueId = data.length > 0 ? data[0].id : await db('users')
      .insert({
        discord_id: userId,
      })
      .returning('id'); ;

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

    await db('user_drug_doses')
      .insert({
        user_id: userUniqueId,
        drug_id: drugId,
        route: roa,
        dose: volume,
        units: units,
        created_at: date,
      });
  }
}
