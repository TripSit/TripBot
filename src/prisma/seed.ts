/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { PrismaClient, drug_roa, drug_variants } from '@prisma/client';
import argon from 'argon2';
import { Duration as DurationCalc } from 'luxon';
import combinedDb from '../../assets/data/combinedDB.json';
import type {
  CbSubstance,
  Dosage,
  Duration,
  Period,
  Strength,
} from '../global/@types/combined';

const drugs = combinedDb as [CbSubstance];

type DrugRecord = CbSubstance & { id: string };

const prisma = new PrismaClient();

const routeMap = {
  vapourized: 'inhaled',
  smoked: 'inhaled',
  hbwr: 'oral',
  morning_glory: 'oral',
  fresh: 'oral',
  dried: 'oral',
  'oral(pure)': 'oral',
  'insufflated(pure)': 'oral',
  'oral(benzedrex)': 'oral',
  wet: 'oral',
  dry: 'oral',
};

function parseDuration(
  name: Period,
  range: string,
  durations: Duration[] | null,
) {
  // Return null immediately if durations array is not provided
  if (!durations) return null;

  // Find the duration object whose name matches the provided name (case-insensitive)
  const duration = durations.find(a => a.name.toLowerCase() === name);

  // Return null if no matching duration is found, or if the value is uncertain or rapid
  if (
    !duration
    || !duration.value
    || duration.value.includes('?')
    || duration.value.toLowerCase().includes('rapid')
  ) {
    return null;
  }

  // Trim and convert the duration value to lower case
  const valueText = duration.value.trim().toLowerCase();

  // Return null if the valueText doesn't contain any digits
  if (!/\d/.test(valueText)) return null; // Validation to omit dirty values

  // Determine the index to use based on the specified range (min or max)
  const index = range === 'min' ? 0 : 1;

  // Extract the numeric value from the range or use the entire valueText if no range is specified
  const value = valueText.includes('-')
    ? valueText.split('-')[index]
    : valueText;

  // Extract the unit from the valueText
  const unitKey = valueText.split(/\s+/g).at(-1);

  // Return null if the unit is not recognized
  if (!unitKey || !['seconds', 'minutes', 'hours', 'days'].includes(unitKey)) return null;

  // Convert the value to a Duration object and return its minute representation
  return DurationCalc.fromObject({
    [unitKey]: parseFloat(value.replace(/\D/g, '')),
  }).get('minutes');
}

const parseDose = (
  name: Strength,
  doses: Dosage[] | null,
) => {
  // Return null if doses array is not provided
  if (!doses) return null;

  // Find the dose object whose name matches the provided name (case-insensitive)
  const dose = doses.find(a => a.name.toLowerCase() === name);

  // Return null if no matching dose is found or if the dose value is missing
  if (!dose?.value) return null;

  // Trim and convert the dose value to lower case for consistent processing
  const valueText = dose.value.trim().toLowerCase();

  // Extract the numeric part from the dose value and convert it to a float
  let value = parseFloat(dose.value.split('-')[0].replace(/\D/g, ''));

  // Check for different units and convert the value accordingly
  if (valueText.includes('g')) {
    // Convert grams to milligrams
    value *= 1000;
  } else if (valueText.includes('\u00b5g') || valueText.endsWith('ug')) {
    // Convert micrograms to milligrams
    value *= 0.001;
  } else if (valueText.includes('kg')) {
    // Convert kilograms to milligrams
    value *= 1000000;
  }

  // Return the value in milligrams
  return value;
};

async function seedUsers():Promise<string> {
  // Users
  const [moonbearUser] = await Promise.all([
    await prisma.users.create({
      data: {
        email: 'moonbear@tripsit.me',
        username: 'MoonBear',
        discord_id: '177537158419054592',
        password_hash: await argon.hash('P@ssw0rd'),
      },
    }),
    // await prisma.users.create({
    //   data: {
    //     email: 'hipperooni@tripsit.me',
    //     username: 'Hipperooni',
    //     discord_id: '121115330637594625',
    //     password_hash: await argon.hash('P@ssw0rd'),
    //   },
    // }),
    // await prisma.users.create({
    //   data: {
    //     email: 'cosmicowl@gmailc.om',
    //     username: 'CosmicOwl',
    //     discord_id: '332687787172167680',
    //     password_hash: await argon.hash('P@ssw0rd'),
    //   },
    // }),
  ]);
  return moonbearUser.id;
}

async function seedDrugs(userId:string):Promise<DrugRecord[]> {
  const drugRecords: DrugRecord[] = await Promise.all(
    drugs.map(async drug => {
      const createdDrug = await prisma.drugs.create({
        data: {
          summary: (drug.summary || '').trim() || null,
          psychonaut_wiki_url: (drug.url || '').trim() || null,
          errowid_experiences_url: (drug.experiencesUrl || '').trim() || null,
          last_updated_by: userId,
        },
        select: {
          id: true,
        },
      });

      return {
        id: createdDrug.id,
        ...drug,
      };
    }),
  );

  return drugRecords;
}

async function seedDrugNames(drugRecords:DrugRecord[]):Promise<void> {
  for (const drug of drugRecords) {
    // Insert aliases
    if (drug.aliases && drug.aliases.length > 0) {
      await Promise.all(drug.aliases.map(async alias => {
        await prisma.drug_names.create({
          data: {
            drug_id: drug.id,
            name: alias.trim(),
            type: 'COMMON',
            is_default: false,
          },
        });
      }));
    }

    // Insert the default name
    await prisma.drug_names.create({
      data: {
        drug_id: drug.id,
        name: drug.name.trim(),
        type: 'COMMON',
        is_default: true,
      },
    });
  }
}

async function seedDrugVariants(drugRecords:DrugRecord[], userId:string):Promise<drug_variants[]> {
  return await Promise.all(
    drugRecords.map(async drug => await prisma.drug_variants.create({
      data: {
        drug_id: drug.id,
        default: true,
        last_updated_by: userId,
      },
    })),
  );
}

async function seedDrugVariantRoas(
  drugRecords:DrugRecord[],
  variantRecords:drug_variants[],
):Promise<void> {
  // Drug variant ROAs
  for (const drug of drugRecords) {
    const drugVariant = variantRecords.find(variant => variant.drug_id === drug.id);

    if (drug.roas && drugVariant) {
      for (const roa of drug.roas.filter(r => r.name)) {
        await prisma.drug_variant_roas.create({
          data: {
            drug_variant_id: drugVariant.id,
            route: (routeMap[roa.name.toLowerCase() as keyof typeof routeMap]
            ?? roa.name).toUpperCase() as drug_roa,

            dose_threshold: parseDose('threshold' as Strength, roa.dosage ?? null),
            dose_light: parseDose('light' as Strength, roa.dosage ?? null),
            dose_common: parseDose('common' as Strength, roa.dosage ?? null),
            dose_strong: parseDose('strong' as Strength, roa.dosage ?? null),
            dose_heavy: parseDose('heavy' as Strength, roa.dosage ?? null),

            duration_total_min: parseDuration('total' as Period, 'min', roa.duration ?? null),
            duration_total_max: parseDuration('total' as Period, 'max', roa.duration ?? null),
            duration_onset_min: parseDuration('onset' as Period, 'min', roa.duration ?? null),
            duration_onset_max: parseDuration('onset' as Period, 'max', roa.duration ?? null),
            duration_comeup_min: parseDuration('comeup' as Period, 'min', roa.duration ?? null),
            duration_comeup_max: parseDuration('comeup' as Period, 'max', roa.duration ?? null),
            duration_peak_min: parseDuration('peak' as Period, 'min', roa.duration ?? null),
            duration_peak_max: parseDuration('peak' as Period, 'max', roa.duration ?? null),
            duration_offset_min: parseDuration('offset' as Period, 'min', roa.duration ?? null),
            duration_offset_max: parseDuration('offset' as Period, 'max', roa.duration ?? null),
            duration_after_effects_min: parseDuration('after effects' as Period, 'min', roa.duration ?? null),
            duration_after_effects_max: parseDuration('after effects' as Period, 'max', roa.duration ?? null),
          },
        });
      }
    }
  }
}

async function seed() {
  await Promise.all([
    await prisma.personas.deleteMany({}),
    await prisma.ai_images.deleteMany({}),
    await prisma.user_actions.deleteMany({}),
    await prisma.user_drug_doses.deleteMany({}),
    await prisma.user_experience.deleteMany({}),
    await prisma.user_reminders.deleteMany({}),
    await prisma.user_tickets.deleteMany({}),
    await prisma.appeals.deleteMany({}),
    await prisma.user_actions.deleteMany({}),
    await prisma.ai_usage.deleteMany({}),
    await prisma.drug_names.deleteMany({}),
    await prisma.drug_variants.deleteMany({}),
    await prisma.drug_variant_roas.deleteMany({}),
  ]);

  await prisma.drugs.deleteMany({});
  await prisma.users.deleteMany({}); // Needs to happen last

  // Start seeding
  const userId = await seedUsers();
  const drugRecords = await seedDrugs(userId);
  await seedDrugNames(drugRecords);
  const variantRecords = await seedDrugVariants(drugRecords, userId);
  await seedDrugVariantRoas(drugRecords, variantRecords);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

export default seed;
