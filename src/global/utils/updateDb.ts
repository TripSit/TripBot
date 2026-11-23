/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable max-len */

import fs from 'fs/promises';
import axios from 'axios';
import { GraphQLClient } from 'graphql-request';
import {
  Dose as TsDose,
  Drug,
  Duration as TsDuration,
  Combos,
  ComboData,
} from 'tripsit_drug_db';
import path from 'path';
import loadedCombinedDb from '../../../assets/data/combinedDB.json';
import loadedTripsitDb from '../../../assets/data/tripsitDB.json';
import loadedCombos from '../../../assets/data/tripsitCombos.json';
import { getOrCreateUser } from './dbRecords';
import {
  CbSubstance,
  Strength,
  Status,
  Psychoactive,
  Chemical,
  Interaction,
  Roa,
  Period,
  Dosage,
  Duration,
} from '../@types/combined';
import {
  PwSubstance,
  Range,
} from '../@types/psychonaut';

// Limits API calls during development
const useCache = env.NODE_ENV === 'development';

const F = f(__filename);

/** True when a dosage list already has an entry with exactly this name. */
const hasDoseNamed = (dosage: Dosage[] | undefined, name: string): boolean => (
  dosage?.some(doseVal => doseVal.name === name) ?? false
);

const emptyToNull = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? null : trimmed;
};

const dataFolder = path.join(__dirname, '../../../assets/data');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveData(data: any, fileName: string): Promise<string> {
  const filePath = path.join(dataFolder, `${fileName}.json`);

  await fs.writeFile(filePath, JSON.stringify(data, null, 2));

  return Promise.resolve(filePath);
}

async function getTSData(): Promise<{
  [key: string]: Drug;
}> {
  // Check if the cache exists, and if so, use it.
  if (useCache) {
    try {
      const rawData = await fs.readFile(path.join(dataFolder, 'tripsitDB.json'));
      return JSON.parse(rawData.toString());
    } catch (err) {
      log.error(F, `Error reading TripSit Drug Cache: ${err}`);
    }
  }

  let drugData: {
    [key: string]: Drug;
  };

  try {
    const data = await axios.get('https://raw.githubusercontent.com/TripSit/drugs/main/drugs.json');
    drugData = data.data as {
      [key: string]: Drug;
    };
  } catch {
    log.error(F, 'Error getting data from TripSit API');
    return {};
  }

  log.info(F, `Got ${Object.keys(drugData).length} drugs from TripSit API!`);

  await saveData(drugData, 'tripsitDB');

  return drugData;
}

async function getTSCombos(): Promise<Combos> {
  // Check if the cache exists, and if so, use it.

  if (useCache) {
    try {
      const rawData = await fs.readFile(path.join(dataFolder, 'tripsitCombos.json'));
      return JSON.parse(rawData.toString());
    } catch (err) {
      log.error(F, `Error reading TripSit Combo Cache: ${err}`);
    }
  }

  const tsComboResponse = await axios.get('https://raw.githubusercontent.com/TripSit/drugs/main/combos.json');
  const tsComboData = tsComboResponse.data as Combos;

  log.info(F, `Got ${Object.keys(tsComboData).length} combos from TripSit API!`);

  await saveData(tsComboData, 'tripsitCombos');

  return tsComboData;
}

async function getPWData(): Promise<PwSubstance[]> {
  if (useCache) {
    try {
      const rawData = await fs.readFile(path.join(dataFolder, 'psychonautDB.json'));
      return JSON.parse(rawData.toString());
    } catch (err) {
      log.error(F, `Error reading PW Cache: ${err}`);
    }
  }

  let pwResponse:{
    substances: PwSubstance[];
  };
  try {
    pwResponse = await new GraphQLClient('https://api.psychonautwiki.org').request(`
    {
      substances(limit: 1000) {
        url
        name
        summary
        addictionPotential
        toxicity
        crossTolerances
        commonNames
        class {chemical psychoactive}
        tolerance {full half zero}
        uncertainInteractions {name}
        unsafeInteractions {name}
        dangerousInteractions {name}
        roa {oral {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} sublingual {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} buccal {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} insufflated {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} rectal {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} transdermal {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} subcutaneous {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} intramuscular {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} intravenous {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} smoked {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}}}    }
    }
    `);
  } catch {
    log.error(F, 'Error getting data from Psychonaut API');
    return [];
  }

  const { substances } = pwResponse;

  log.info(F, `Got ${substances.length} drugs from Psychonaut API!`);

  await saveData(substances, 'psychonautDB');
  return substances;
}

async function formatTsDuration(
  durationData: TsDuration,
  type: string,
  combinedDrug: CbSubstance,
) {
  const durationUnit = durationData._unit;
  // Check if one of the keys is 'value' and if so, use that and assume "Oral"  roa

  const periodName = type.slice(0, 1).toUpperCase() + type.slice(1) as Period; // Capitalize the first letter

  if (durationData.value) {
    const roaEntry = combinedDrug.roas?.find(roa => roa.name === 'Oral') ?? {} as Roa;

    roaEntry.duration ??= [];

    // Check if the periodName already exists in the roaEntry duration list
    if (roaEntry.duration.find(duration => duration.name === periodName)) {
      return;
    }

    roaEntry.duration.push({
      name: periodName, // Capitalize the first letter
      value: `${durationData.value} ${durationUnit}`,
    });
  } else {
    Object.entries(durationData).forEach(([durationKey, durationValue]) => {
      if (durationKey !== '_unit') {
        const roaEntry = combinedDrug.roas?.find(roa => roa.name === durationKey) ?? {} as Roa;

        roaEntry.duration ??= [];

        // Check if the periodName already exists in the roaEntry duration list
        if (roaEntry.duration.find(duration => duration.name === periodName)) {
          return;
        }
        roaEntry.duration.push({
          name: periodName,
          value: `${durationValue} ${durationUnit}`,
        });
      }
    });
  }
}

async function combinePw(
  pwData: PwSubstance[],
  combinedDb: CbSubstance[],
) {
  pwData.forEach(pwDrug => {
    // Check if the drug already exists in the combinedDb
    const combinedDrug = combinedDb.find(drug => drug.name.toLowerCase() === pwDrug.name.toLowerCase()) ?? {} as CbSubstance;

    combinedDrug.url = pwDrug.url;
    // combinedDrug.experiencesUrl = // Tripsit only
    combinedDrug.name = pwDrug.name;
    combinedDrug.aliases = pwDrug.commonNames ?? undefined;
    combinedDrug.aliasesStr = pwDrug.commonNames ? pwDrug.commonNames.join(', ') : undefined;
    combinedDrug.summary = pwDrug.summary.length > 0 ? pwDrug.summary : undefined;
    combinedDrug.toxicity = pwDrug.toxicity ?? undefined;
    combinedDrug.addictionPotential = pwDrug.addictionPotential ?? undefined;
    combinedDrug.tolerance = pwDrug.tolerance ?? undefined;
    combinedDrug.crossTolerances = pwDrug.crossTolerances ?? undefined;

    if (pwDrug.roa) {
      Object.entries(pwDrug.roa).forEach(([roaName, pwRoa]) => {
        if (!pwRoa) return;
        const roaEntry = {
          name: roaName.slice(0, 1).toUpperCase() + roaName.slice(1),
        } as {
          name: string;
          dosage?: Dosage[];
          duration?: Duration[];
          bioavailability?: string;
        };

        if (pwRoa.dose) {
          roaEntry.dosage = [];
          const { units } = pwRoa.dose;

          Object.entries(pwRoa.dose).forEach(([doseName, doseData]) => {
            if (!doseData) return;

            // If the doseData is a string, it's the unit, don't do  anything
            if (typeof doseData === 'string') {
              return;
            }

            let doseString = '';

            if ((doseData as Range).min) {
              const { min } = doseData as Range;
              const { max } = doseData as Range;
              doseString = `${min}-${max} ${units}`;
            } else {
              doseString = `${JSON.stringify(doseData)} ${units}`;
            }

            const doseEntry = {
              name: doseName.slice(0, 1).toUpperCase() + doseName.slice(1),
              value: doseString,
            } as Dosage;

            roaEntry.dosage?.push(doseEntry);
          });

          if (pwRoa.duration) {
            roaEntry.duration = [];
            Object.keys(pwRoa.duration).forEach(durationName => {
              const duration = pwRoa.duration[durationName as keyof typeof pwRoa.duration];
              if (!duration) return;
              if (!duration.min) return;
              const durationMax = duration.max ? `-${duration.max}` : null;

              const durationEntry = {
                name: durationName.slice(0, 1).toUpperCase() + durationName.slice(1) as Period,
                value: `${duration.min}${durationMax} ${duration.units}`,
              } as Duration;

              roaEntry.duration?.push(durationEntry);
            });
          }

          if (pwRoa.bioavailability) {
            roaEntry.bioavailability = pwRoa.bioavailability.max ? pwRoa.bioavailability.max.toString() : '';
            roaEntry.bioavailability = `${roaEntry.bioavailability}%`;
          }

          if (roaEntry.dosage && roaEntry.dosage.length > 0 && roaEntry.duration && roaEntry.duration.length > 0) {
            combinedDrug.roas ??= [] as Roa[];
            combinedDrug.roas.push(roaEntry);
          }
        }
      });
    }

    if (pwDrug.uncertainInteractions || pwDrug.unsafeInteractions || pwDrug.dangerousInteractions) {
      combinedDrug.interactions = [];
      if (pwDrug.uncertainInteractions) {
        pwDrug.uncertainInteractions.forEach(interaction => {
          const interactionEntry = {
            status: 'Caution' as Status,
            name: interaction.name,
          };
          combinedDrug.interactions?.push(interactionEntry);
        });
      }
      if (pwDrug.unsafeInteractions) {
        pwDrug.unsafeInteractions.forEach(interaction => {
          const interactionEntry = {
            status: 'Unsafe' as Status,
            name: interaction.name,
          };
          combinedDrug.interactions?.push(interactionEntry);
        });
      }
      if (pwDrug.dangerousInteractions) {
        pwDrug.dangerousInteractions.forEach(interaction => {
          const interactionEntry = {
            status: 'Dangerous' as Status,
            name: interaction.name,
          };
          combinedDrug.interactions?.push(interactionEntry);
        });
      }
    }

    if (combinedDrug.roas) {
      combinedDrug.roas.forEach(roa => {
        if (roa.dosage) {
        // This is the order we want them to be in
          const strengths = [
            'Threshold',
            'Light',
            'Common',
            'Strong',
            'Heavy',
            'Dangerous',
            'Fatal',
          ];

          // Sort the dosage array by name
          roa.dosage.sort(
            (a, b) => strengths.indexOf(a.name) - strengths.indexOf(b.name),
          );
        }
        if (roa.duration) {
          // This is the order we want them to be in
          const periods = [
            'Comeup',
            'Onset',
            'Duration',
            'Peak',
            'Offset',
            'Afterglow',
            'After Effects',
            'Total',
          ];

          // Sort the duration array by name
          roa.duration.sort(
            (a, b) => periods.indexOf(a.name) - periods.indexOf(b.name),
          );
        }
      });
    }
    combinedDb.push(combinedDrug);
  });
}

// This is the order we want the strengths to be in
const TS_STRENGTHS = [
  'Threshold',
  'Light',
  'Common',
  'Strong',
  'Heavy',
  'Dangerous',
  'Fatal',
];

/**
 * Turns plain doses like "10-20mg" into "10-20 mg". Anything that does not fit that exact shape ("200mg+",
 * "50mg-70mg", "100+mg", "7.5-15mg/kg") keeps the TripSit wording, because rebuilding it would drop the "or more",
 * the unit or the upper bound. Returns null when the text has no number.
 */
export function parseDoseValue(strengthData: string): string | null {
  const trimmed = strengthData.trim();
  let end = trimmed.length;
  while (end > 0 && trimmed[end - 1] === '.') end -= 1;
  const text = trimmed.slice(0, end);
  if (!/\d/.test(text)) return null;

  const plain = /^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?([a-zA-Z]+)?$/.exec(text);
  if (!plain) return text;

  const [, min, max, unit = ''] = plain;
  const maxString = max ? `-${parseFloat(max)}` : '';
  return `${parseFloat(min)}${maxString} ${unit}`;
}

/** Adds the dosage of one route of administration from the TripSit data to the combined drug. */
function addTsDoseRoa(tsDrug: Drug, combinedDrug: CbSubstance, doseRoa: string, dosage: NonNullable<TsDose[keyof TsDose]>): void {
  const roaEntry = combinedDrug.roas?.find(roa => roa.name === doseRoa) ?? {} as Roa;
  roaEntry.name = doseRoa;
  let roaNote = tsDrug.dose_note;

  // Sort the keys according to that order
  const sortedKeys = Object.keys(dosage).sort(
    (a, b) => TS_STRENGTHS.indexOf(a) - TS_STRENGTHS.indexOf(b),
  );

  // For each strength in the ROA
  sortedKeys.forEach(strength => {
    // Check if the strength already exists from PW and if so, skip it
    if (hasDoseNamed(roaEntry.dosage, strength)) {
      return;
    }

    const strengthData = dosage[strength as keyof typeof dosage] as string;

    if (strength.toLowerCase() === 'note') {
      roaNote = strengthData;
      return;
    }

    const value = parseDoseValue(strengthData);
    if (value === null) return;

    roaEntry.dosage ??= [];

    // Check if the strength is included as a Name value
    if (TS_STRENGTHS.includes(strength)) {
      roaEntry.dosage.push({
        name: strength.slice(0, 1).toUpperCase() + strength.slice(1) as Strength,
        value,
        note: roaNote,
      });
    } else {
      log.info(F, `[combineTs] ${tsDrug.name} has an unrecognized strength: ${strength}`);
    }
  });
  const roas = combinedDrug.roas ?? [] as Roa[];
  roas.push(roaEntry);
  Object.assign(combinedDrug, { roas });
}

async function combineTs(
  tsData: {
    [key: string]: Drug;
  },
  combinedDb: CbSubstance[],
) {
  Object.keys(tsData).forEach(key => {
    const tsDrug = tsData[key as keyof typeof tsData];

    // Check if the drug already exists in the combinedDb
    // Add the drug when psychonaut did not list it. A const keeps the narrowing inside the callbacks below.
    const combinedDrug = combinedDb.find(drug => drug.name.toLowerCase() === tsDrug.name.toLowerCase())
      ?? (() => {
        const added = {
          name: tsDrug.name,
          url: `https://wiki.tripsit.me/wiki/${tsDrug.name}`,
        } as CbSubstance;
        combinedDb.push(added);
        return added;
      })();

    if (tsDrug.links?.experiences) {
      combinedDrug.experiencesUrl = tsDrug.links.experiences;
    }

    if (tsDrug.aliases) {
      // Go through combinedDrug.aliases and add any aliases that don't already exist
      combinedDrug.aliases ??= [];
      tsDrug.aliases.forEach(alias => {
        if (!combinedDrug?.aliases?.includes(alias)) {
          combinedDrug?.aliases?.push(alias);
        }
      });

      combinedDrug.aliasesStr ??= tsDrug.aliases.join(', ');
      tsDrug.aliases.forEach(alias => {
        if (!combinedDrug?.aliasesStr?.includes(alias)) {
          combinedDrug.aliasesStr = `${combinedDrug.aliasesStr}, ${alias}`;
        }
      });
    }

    if (tsDrug.properties?.summary) {
      combinedDrug.summary = tsDrug.properties.summary;
    }

    if (tsDrug.properties?.['test-kits']) {
      combinedDrug.reagents = tsDrug.properties['test-kits'];
    }

    if (tsDrug.categories) {
      const psychoactiveNames = {
        Antidepressant: 'Antidepressant',
        Antipsychotic: 'Antipsychotic',
        'Atypical neuroleptic': 'Atypical neuroleptic',
        Cannabinoid: 'Cannabinoid',
        Deliriant: 'Deliriant',
        Depressant: 'Depressant',
        Dissociative: 'Dissociative',
        Empathogen: 'Empathogen',
        Entactogen: 'Entactogen',
        Eugeroic: 'Eugeroic',
        'Habit Forming': 'Habit Forming',
        Hallucinogen: 'Hallucinogen',
        Hypnotic: 'Hypnotic',
        Inactive: 'Inactive',
        Nootropic: 'Nootropic',
        Oneirogen: 'Oneirogen',
        Opioid: 'Opioid',
        Psychedelic: 'Psychedelic',
        'Research Chemical': 'Research Chemical',
        SSRI: 'SSRI',
        Stimulant: 'Stimulant',
        Supplement: 'Supplement',
        Tentative: 'Tentative',
      };

      const chemicalNames = {
        '4-oxazolidinone': '4-oxazolidinone',
        'Amino acid': 'Amino acid',
        'Amino acid analogue': 'Amino acid analogue',
        'Ammonium salt': 'Ammonium salt',
        Amine: 'Amine',
        Aminoindane: 'Aminoindane',
        Amphetamine: 'Amphetamine',
        Adamantane: 'Adamantane',
        Alcohol: 'Alcohol',
        Alkanediol: 'Alkanediol',
        Anilidopiperidine: 'Anilidopiperidine',
        Arylcyclohexylamine: 'Arylcyclohexylamine',
        Barbiturate: 'Barbiturate',
        Benzamide: 'Benzamide',
        Benzazepine: 'Benzazepine',
        Benzhydryl: 'Benzhydryl',
        Benzisoxazole: 'Benzisoxazole',
        Benzodiazepine: 'Benzodiazepine',
        Butyrophenone: 'Butyrophenone',
        'Butyric acid': 'Butyric acid',
        Cannabinoid: 'Cannabinoid',
        Carbamate: 'Carbamate',
        Common: 'Common',
        'Choline derivative': 'Choline derivative',
        Cysteine: 'Cysteine',
        Cycloalkylamine: 'Cycloalkylamine',
        Cyclopyrrolone: 'Cyclopyrrolone',
        Diarylethylamine: 'Diarylethylamine',
        Diol: 'Diol',
        Diphenylpropylamine: 'Diphenylpropylamine',
        Dibenzothiazepine: 'Dibenzothiazepine',
        'Ethanolamine#1#': 'Ethanolamine#1#',
        Gabapentinoid: 'Gabapentinoid',
        Imidazoline: 'Imidazoline',
        Imidazopyridine: 'Imidazopyridine',
        Indazole: 'Indazole',
        Indazolecarboxamide: 'Indazolecarboxamide',
        Indolecarboxamide: 'Indolecarboxamide',
        Indolecarboxylate: 'Indolecarboxylate',
        'Indole alkaloid': 'Indole alkaloid',
        'Indole cannabinoid': 'Indole cannabinoid',
        Khat: 'Khat#1#',
        Lactone: 'Lactone',
        Lysergamide: 'Lysergamide',
        MDxx: 'MDxx',
        Naphthoylindole: 'Naphthoylindole',
        Naphthoylindazole: 'Naphthoylindazole',
        'Nitrogenous organic acid': 'Nitrogenous organic acid',
        Peptide: 'Peptide',
        Phenothiazine: 'Phenothiazine',
        Phenylmorpholine: 'Phenylmorpholine',
        Phenylpropene: 'Phenylpropene',
        Phenylpropylamine: 'Phenylpropylamine',
        Piperazinoazepine: 'Piperazinoazepine',
        Popper: 'Popper',
        Pyridine: 'Pyridine',
        Quinazolinone: 'Quinazolinone',
        Racetam: 'Racetam',
        Salvinorin: 'Salvinorin',
        'Substituted aminorexe': 'Substituted aminorexe',
        'Substituted amphetamine': 'Substituted amphetamine',
        'Substituted benzofuran': 'Substituted benzofuran',
        'Substituted cathinone': 'Substituted cathinone',
        'Substituted morphinan': 'Substituted morphinan',
        'Substituted phenethylamine': 'Substituted phenethylamine',
        'Substituted phenidate': 'Substituted phenidate',
        'Substituted piperazine': 'Substituted piperazine',
        'Substituted piperidine': 'Substituted piperidine',
        'Substituted pyrrolidine': 'Substituted pyrrolidine',
        'Substituted tropane': 'Substituted tropane',
        'Substituted tryptamine': 'Substituted tryptamine',
        Terpenoid: 'Terpenoid',
        Tetrahydroisoxazole: 'Tetrahydroisoxazole',
        Tetrahydroisoxazolopyridine: 'Tetrahydroisoxazolopyridine',
        Thienodiazepine: 'Thienodiazepine',
        Thiophene: 'Thiophene',
        'Tricyclic antidepressant': 'Tricyclic antidepressant',
        'Purine alkaloid': 'Purine alkaloid',
        Xanthine: 'Xanthine',
      };

      const categoryMap = {
        barbiturate: 'Barbiturate',
        benzodiazepine: 'Benzodiazepine',
        common: 'Common',
        deliriant: 'Deliriant',
        depressant: 'Depressant',
        dissociative: 'Dissociative',
        empathogen: 'Empathogen',
        'habit-forming': 'Habit Forming',
        inactive: 'Inactive',
        nootropic: 'Nootropic',
        opioid: 'Opioid',
        psychedelic: 'Psychedelic',
        'research-chemical': 'Research Chemical',
        ssri: 'SSRI',
        stimulant: 'Stimulant',
        supplement: 'Supplement',
        tentative: 'Tentative',
      };

      const psychoactiveList = [] as Psychoactive[];
      const chemicalList = [] as Chemical[];

      tsDrug.categories.forEach(category => {
        const mappedCategory = categoryMap[category];

        const chemFound = Object.keys(chemicalNames).find(name => name.toLowerCase() === mappedCategory.toLowerCase());
        const psychoactiveFound = Object.keys(psychoactiveNames).find(name => name.toLowerCase() === mappedCategory.toLowerCase());
        if (chemFound) {
          chemicalList.push(chemFound as Chemical);
        } else if (psychoactiveFound) {
          psychoactiveList.push(psychoactiveFound as Psychoactive);
        /* v8 ignore start -- the tables above are static and consistent; this only fires if a category is added without a name */
        } else {
          log.info(F, `[combineTs] ${tsDrug.name} has an unrecognized category: ${mappedCategory}`);
          log.info(F, `Originally ${category} > ${mappedCategory}`);
        }
        /* v8 ignore stop */
      });

      combinedDrug.classes = {
        psychoactive: [...psychoactiveList].sort((a, b) => a.localeCompare(b)) as [Psychoactive],
        chemical: [...chemicalList].sort((a, b) => a.localeCompare(b)) as [Chemical],
      };
    }

    // combinedDrug.toxicity = // PW only
    // combinedDrug.addictionPotential = // PW only
    // combinedDrug.tolerance = // PW only - ts has this filed but it's not populated often
    // combinedDrug.crossTolerances = // PW only

    // Roas
    if (tsDrug.formatted_dose
      || tsDrug.formatted_duration
       || tsDrug.formatted_onset
       || tsDrug.formatted_aftereffects
       || tsDrug.properties.bioavailability
    ) {
      if (tsDrug.formatted_dose) {
        const dose = tsDrug.formatted_dose;
        Object.entries(dose).forEach(([doseRoa, dosage]) => addTsDoseRoa(tsDrug, combinedDrug, doseRoa, dosage));
      }

      if (tsDrug.formatted_onset) {
        formatTsDuration(tsDrug.formatted_onset, 'Onset', combinedDrug);
      }
      if (tsDrug.formatted_duration) {
        formatTsDuration(tsDrug.formatted_duration, 'Duration', combinedDrug);
      }
      if (tsDrug.formatted_aftereffects) {
        formatTsDuration(tsDrug.formatted_aftereffects, 'After Effects', combinedDrug);
      }
    }

    if (tsDrug.combos) {
      combinedDrug.interactions = [];
      const { combos } = tsDrug;
      Object.keys(combos).forEach(comboName => {
        const combo = combos[comboName as keyof typeof combos] as ComboData;
        const interactionEntry = {
          status: combo.status as Status,
          name: comboName,
        } as Interaction;

        if (combo.note) {
          interactionEntry.note = combo.note;
        }

        if (combo.sources) {
          interactionEntry.sources = combo.sources;
        }

        combinedDrug.interactions?.push(interactionEntry);
      });
    }
  });
}

export async function syncDrugNames(combinedDb: CbSubstance[]): Promise<void> {
  const rows = await db.drug_names.findMany({ select: { name: true } });
  const known = new Set(rows.map(row => row.name.trim().toLowerCase()));
  const missing = combinedDb.filter(drug => !known.has(drug.name.trim().toLowerCase()));
  if (missing.length === 0) return;

  const botUser = await getOrCreateUser(env.DISCORD_CLIENT_ID);

  let added = 0;
  for (const drug of missing) { // eslint-disable-line no-restricted-syntax
    const name = drug.name.trim();
    // The same name can appear twice in the batch, or as an earlier drug's alias; it must only be created once
    if (!known.has(name.toLowerCase())) {
      known.add(name.toLowerCase());
      const aliases = (drug.aliases ?? []).map(alias => alias.trim()).filter(alias => {
        const isNew = !known.has(alias.toLowerCase());
        known.add(alias.toLowerCase());
        return isNew;
      });

      // eslint-disable-next-line no-await-in-loop
      await db.drugs.create({
        data: {
          summary: emptyToNull(drug.summary),
          psychonaut_wiki_url: emptyToNull(drug.url),
          errowid_experiences_url: emptyToNull(drug.experiencesUrl),
          last_updated_by: botUser.id,
          drug_names: {
            create: [
              { name, type: 'COMMON', is_default: true },
              ...aliases.map(alias => ({ name: alias, type: 'COMMON' as const, is_default: false })),
            ],
          },
        },
      });
      added += 1;
    }
  }

  log.info(F, `Added ${added} new drugs to drug_names`);
}

/**
 * The drug data is loaded from the JSON files once, when each module is first imported, so a refreshed file on
 * disk would never be seen until a restart. Every importer holds the same module object, so replacing its
 * contents in place makes /drug, /combo and the API serve the new data immediately.
 */
function refreshLoadedData(combinedDb: CbSubstance[], tsData: { [key: string]: Drug }, tsCombos: Combos): void {
  const combined = loadedCombinedDb as unknown as CbSubstance[];
  combined.splice(0, combined.length, ...combinedDb);
  const tripsit = loadedTripsitDb as unknown as Record<string, Drug>;
  Object.keys(tripsit).forEach(key => { delete tripsit[key]; });
  Object.assign(tripsit, tsData);
  Object.keys(loadedCombos).forEach(key => { Reflect.deleteProperty(loadedCombos, key); });
  Object.assign(loadedCombos, tsCombos);
}

export default async function updateDrugDb():Promise<void> {
  const combinedDb = [] as CbSubstance[];
  // Check if the assets folder exists and if not, create  it
  // if (!fs.existsSync(assetFolder)) {
  //   fs.mkdirSync(assetFolder);
  // }

  const tsCombos = await getTSCombos();
  const pwData = await getPWData();
  await combinePw(pwData, combinedDb);
  const tsData = await getTSData();
  await combineTs(tsData, combinedDb);
  const filePath = await saveData(combinedDb, 'combinedDB');
  log.info(F, `Updated combinedDB of ${combinedDb.length} drugs to ${filePath}`);
  refreshLoadedData(combinedDb, tsData, tsCombos);

  try {
    await syncDrugNames(combinedDb);
  } catch (err) {
    log.error(F, `Error syncing drug_names: ${err}`);
  }
}
