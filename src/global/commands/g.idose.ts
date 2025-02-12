import { $Enums, drug_mass_unit, drug_roa } from '@prisma/client';
import {
  time,
} from 'discord.js';
import { DateTime } from 'luxon';

type IDoseResponse = {
  name: string,
  value: string,
}[];

const F = f(__filename);

async function iDoseGet(
  userId: string,
):Promise<IDoseResponse> {
  const userData = await db.users.upsert({
    where: {
      discord_id: userId,
    },
    create: {
      discord_id: userId,
    },
    update: {},
  });

  // log.debug(F, `Getting data for ${userData.id}...`);

  const doseData = await db.user_drug_doses.findMany({
    where: {
      user_id: userData.id,
    },
  });

  if (doseData.length === 0) {
    return [{
      name: 'Error',
      value: 'You have no dose records, you can use /idose to add some!',
    }];
  }

  // log.debug(F, `Data: ${JSON.stringify(unsortedData, null, 2)}`);

  // Sort data based on the created_at property
  const data = [...doseData].sort((a, b) => {
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

    // eslint-disable-next-line no-await-in-loop
    const drugData = await db.drug_names.findFirstOrThrow({
      where: {
        drug_id: drugId,
        is_default: true,
      },
    });

    const drugName = drugData.name; // eslint-disable-line no-await-in-loop

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
  return doses;
}

async function iDoseSet(
  userId: string,
  substance: string | null,
  volume: number | null,
  units: drug_mass_unit | null,
  roa: drug_roa | null,
  date: Date | null,
):Promise<IDoseResponse> {
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

  const drugData = await db.drug_names.findMany({
    where: {
      name: {
        in: [substance, substance.toLowerCase(), substance.toUpperCase()],
      },
    },
  });

  // log.debug(F, `Data: ${JSON.stringify(data, null, 2)}`);

  if (drugData.length === 0) {
    // log.debug(`name = ${substance} not found in 'drugNames'`);
    return [{
      name: 'Error',
      value: 'That drug does not exist!',
    }];
  }

  const drugId = drugData[0].drug_id;

  // log.debug(F, `drugId: ${drugId}`);
  const userData = await db.users.upsert({
    where: {
      discord_id: userId,
    },
    create: {
      discord_id: userId,
    },
    update: {},
  });

  await db.user_drug_doses.create({
    data: {
      user_id: userData.id,
      drug_id: drugId,
      route: roa,
      dose: volume,
      units: units.toString() === 'µG' ? $Enums.drug_mass_unit.MICRO_G : units,
      created_at: date,
    },
  });

  return [{
    name: 'Success',
    value: 'I added a new value for you!',
  }];
}

async function iDoseDel(
  recordNumber: number | null,
  userId: string,
):Promise<IDoseResponse> {
  if (recordNumber === null) {
    return [{
      name: 'Error',
      value: 'You must provide a record number to delete!',
    }];
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

  const doseData = await db.user_drug_doses.findMany({
    where: {
      user_id: userData.id,
    },
  });

  if (doseData.length === 0) {
    return [{
      name: 'Error',
      value: 'You have no dose records, you can use /idose to add some!',
    }];
  }

  // Sort data based on the created_at property
  const data = [...doseData].sort((a, b) => {
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

  const drugData = await db.drug_names.findMany({
    where: {
      drug_id: drugId,
    },
  });

  if (drugData.length === 0) {
    return [{
      name: 'Error',
      value: 'That drug does not exist!',
    }];
  }
  const drugName = drugData[0].name;
  const route = record.route.charAt(0).toUpperCase() + record.route.slice(1).toLowerCase();

  // log.debug(F, `I deleted:
  // (${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}
  // ${record.dose} ${record.units} of ${drugName} ${route}
  // `);

  await db.user_drug_doses.delete({
    where: {
      id: recordId,
    },
  });

  return [{
    name: 'Success',
    value: `I deleted:
        > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
        > ${record.dose} ${record.units} of ${drugName} ${route}
        `,
  }];
}

export async function idose(
  command: 'get' | 'set' | 'delete',
  recordNumber: number | null,
  userId: string,
  substance: string | null,
  volume: number | null,
  units: drug_mass_unit | null,
  roa: drug_roa | null,
  date: Date | null,
):Promise<IDoseResponse> {
  let response = {} as IDoseResponse;

  switch (command) {
    case 'get':
      response = await iDoseGet(userId);
      break;
    case 'set':
      response = await iDoseSet(
        userId,
        substance,
        volume,
        units,
        roa,
        date,
      );
      break;
    case 'delete':
      response = await iDoseDel(
        recordNumber,
        userId,
      );
      break;
    default:
      break;
  }

  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

export default idose;
