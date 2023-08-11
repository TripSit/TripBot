import path from 'node:path';
import fs from 'node:fs/promises';
import type { Knex } from 'knex';
import argon from 'argon2';
import { Duration } from 'luxon';

// TODO: Revise
const routeMap = {
  sublingually: 'sublingual',
  plugged: 'rectal',
  none: 'oral',
  light: 'oral',
  duration: 'oral',
  therapeutic: 'oral',
  vapourised: 'oral',
  threshold: 'oral',
  sleep: 'oral',
  orally: 'oral',
  'oral-ir': 'oral',
  'oral-xr': 'oral',
  'insufflated-xr': 'insufflated',
  'insufflated-ir': 'insufflated',
  'pain-relief': 'oral',
  fever: 'oral',
  metabolites: 'oral',
  'sublingual/insufflated': 'sublingual',
  'insufflated/rectal': 'insufflated',
  'insufflated/inhaled': 'insufflated',
  'vapourized/sublingual': 'inhaled',
  intranasal: 'insufflated',
  6: 'oral',
  60: 'oral',
  parent: 'oral',
  low: 'oral',
  smoking: 'inhaled',
  insufflted: 'insufflated',
  recovery: 'oral',
  oral_maoi: 'oral',
  chewed: 'oral',
  morning_glory: 'oral',
  oral_ir: 'oral',
  oral_er: 'oral',
  'iv/im': 'intravenous',
  hbwr: 'oral',
  'plugged/rectal': 'rectal',
  'vaporized/smoked': 'inhaled',
  smoked: 'inhaled',
  im: 'intramuscular',
  intramuscul: 'intramuscular',
  iv: 'intravenous',
  vaporized: 'inhaled',
  vapourized: 'inhaled',
  'buccal/sublingual': 'sublingual',
  'sublingual/buccal': 'sublingual',
  'insufflated/plugged': 'insufflated',
  '(tentative)': 'oral',
  common: 'oral',
  intravenously: 'intravenous',
  oral_tea: 'oral',
  fresh: 'oral',
  dried: 'oral',
  vaped: 'inhaled',
  intranasally: 'insufflated',
  'oral(pure)': 'oral',
  'insufflated(pure)': 'oral',
  'oral(benzedrex)': 'oral',
  nasal: 'insufflated',
  tilidine: 'oral',
  wet: 'oral',
  dry: 'oral',
};

interface DoseImport {
  name: string;
  value: string;
}

interface DurationImport {
  name: string;
  value: string;
}

interface DrugImport {
  name: string;
  url: string;
  experiencesUrl: string;
  aliases: string[];
  aliasesStr: string;
  summary: string | null;
  reagents: string | null;
  classes: null | {
    chemical: string[];
    psychoactive: string[];
  };
  toxicity: string[];
  addictionPotential: string | null;
  tolerance: null | {
    full: string | null;
    half: string | null;
    zero: string | null;
  };
  crossTolerance: string[] | null;
  roas: {
    name: keyof typeof routeMap;
    route: keyof typeof routeMap;
    dosage: DoseImport[] | null;
    duration: DurationImport[] | null;
  }[];
  interaction: null | {
    name: string;
    status: string;
    note?: string;
  }[];
}

function parseDose(name: string, doses: DoseImport[] | null) {
  if (!doses) return null;
  const dose = doses.find(a => a.name.toLowerCase() === name);
  if (!dose || !dose.value) return null;

  const valueText = dose.value.trim().toLowerCase();
  let value = parseFloat(dose.value.split('-')[0].replace(/\D/g, ''));
  if (valueText.includes('g')) value *= 1000;
  else if (valueText.includes('\u00b5g') || valueText.endsWith('ug')) value *= 0.001;
  else if (valueText.includes('kg')) value *= 1000000;

  return value;
}

function parseDuration(name: string, range: string, durations: DurationImport[] | null) {
  if (!durations) return null;
  const duration = durations.find(a => a.name.toLowerCase() === name);
  if (
    !duration
    || duration.value.includes('?')
    || duration.value.toLowerCase().includes('rapid')
  ) {
    return null;
  }

  const valueText = duration.value.trim().toLowerCase();
  if (!/\d/.test(valueText)) return null; // TODO: Validation is omitting dirty values
  const index = range === 'min' ? 0 : 1;
  const value = valueText.includes('-')
    ? valueText.split('-')[index]
    : valueText;

  const unitKey = valueText.split(/\s+/g).at(-1);
  // TODO: Validation is omitting dirty values
  if (!unitKey || !['seconds', 'minutes', 'hours', 'days'].includes(unitKey)) return null;

  return Duration.fromObject({
    [unitKey]: parseFloat(value.replace(/\D/g, '')),
  }).get('minutes');
}

export async function seed(knex: Knex) {
  const drugs = await fs.readFile(path.join(__dirname, 'drugs-import.json'), 'utf-8')
    .then((contents): DrugImport[] => JSON.parse(contents))
    .then(drugImport => drugImport.map(drug => ({
      ...drug,
      roas: drug.roas.map(({ name, ...roa }) => ({
        ...roa,
        route: typeof name === 'string' ? name.toLowerCase().replace(/:$/, '').trim() : name,
      })),
    }))) as DrugImport[];

  await knex('drugVariantRoas').del();
  await knex('drugVariants').del();
  await knex('drugNames').del();
  await knex('drugs').del();
  await knex('users').del();

  const [defaultUserId] = await Promise.all([
    knex('users').insert({
      email: 'moonbear@tripsit.me',
      username: 'MoonBear',
      discordId: 'moonbearDiscordId',
      passwordHash: await argon.hash('P@ssw0rd'),
    })
      .returning(['id'])
      .then(([{ id }]) => id),
    knex('users').insert([
      {
        email: 'cosmicowl@tripsit.me',
        username: 'CosmicOwl',
        discordId: 'cowmicowlDiscordId',
        passwordHash: await argon.hash('P@ssw0rd'),
      },
      {
        email: 'skyWhale@tripsit.me',
        username: 'SkyWhale',
        discordId: 'skywhaleDiscordId',
        passwordHash: await argon.hash('P@ssw0rd'),
      },
    ]),
  ]);

  const drugRecords = await knex('drugs')
    .insert(drugs.map(drug => ({
      summary: (drug.summary || '').trim() || null,
      psychonautWikiUrl: (drug.url || '').trim() || null,
      errowidExperiencesUrl: (drug.experiencesUrl || '').trim() || null,
      lastUpdatedBy: defaultUserId,
    })))
    .returning(['id'])
    .then(records => records.map(({ id }, i) => ({
      id,
      ...drugs[i],
    })));

  await knex('drugNames').insert(drugRecords.flatMap(drug => drug.aliases
    .map(alias => ({
      drugId: drug.id,
      name: alias.trim(),
      type: 'COMMON',
      isDefault: false,
    }))
    .concat({
      drugId: drug.id,
      name: drug.name.trim(),
      type: 'COMMON',
      isDefault: true,
    })));

  const variantRecords = await knex('drugVariants')
    .insert(drugRecords.map(drug => ({
      drugId: drug.id,
      default: true,
      lastUpdatedBy: defaultUserId,
    })))
    .returning('*');

  return knex('drugVariantRoas').insert(drugRecords.flatMap(drug => drug.roas
    .filter(roa => roa.route)
    .map(roa => ({
      drugVariantId: variantRecords.find(variant => variant.drugId === drug.id).id,
      route: typeof (routeMap[roa.route] || roa.route) === 'string'
        ? ((routeMap[roa.route] || roa.route) as string).toUpperCase()
        : (routeMap[roa.route] || roa.route),

      doseThreshold: parseDose('threshold', roa.dosage),
      doseLight: parseDose('light', roa.dosage),
      doseCommon: parseDose('common', roa.dosage),
      doseStrong: parseDose('strong', roa.dosage),
      doseHeavy: parseDose('heavy', roa.dosage),

      durationTotalMin: parseDuration('total', 'min', roa.duration),
      durationTotalMax: parseDuration('total', 'max', roa.duration),
      durationOnsetMin: parseDuration('onset', 'min', roa.duration),
      durationOnsetMax: parseDuration('onset', 'max', roa.duration),
      durationComeupMin: parseDuration('comeup', 'min', roa.duration),
      durationComeupMax: parseDuration('comeup', 'max', roa.duration),
      durationPeakMin: parseDuration('peak', 'min', roa.duration),
      durationPeakMax: parseDuration('peak', 'max', roa.duration),
      durationOffsetMin: parseDuration('offset', 'min', roa.duration),
      durationOffsetMax: parseDuration('offset', 'max', roa.duration),
      durationAfterEffectsMin: parseDuration('after effects', 'min', roa.duration),
      durationAfterEffectsMax: parseDuration('after effects', 'max', roa.duration),
    }))));
}

export default seed;
