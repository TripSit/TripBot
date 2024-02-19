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
} from 'tripsit_drug_db';
import path from 'path';
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
  Dose as PwDose,
  Duration as PwDuration,
  PwSubstance,
  Range,
} from '../@types/psychonaut';
import { Combos } from '../@types/tripsitCombos';

// Limits API calls during development
const useCache = false;

const F = f(__filename);

const dataFolder = path.join(__dirname, '../../../assets/data');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveData(data: any, fileName: string): Promise<string> {
  // log.debug(F, 'Starting save!');

  const filePath = path.join(dataFolder, `${fileName}.json`);

  // log.debug(F, `Saving ${Object.values(data).length} data  to ${filePath}!`);

  await fs.writeFile(filePath, JSON.stringify(data, null, 2));

  return new Promise(resolve => {
    resolve(filePath);
  });
}

async function getTSData(): Promise<{
  [key: string]: Drug;
}> {
  // Check if the cache exists, and if so, use it.
  if (useCache) {
    try {
      const rawData = fs.readFile(path.join(dataFolder, 'tripsitDB.json'));
      log.debug(F, `Got ${Object.keys(rawData).length} drugs from TripSit Cache!`);
      return JSON.parse(rawData.toString());
    } catch (err) {
      log.error(F, `Error reading TripSit Cache: ${err}`);
    }
  }

  log.debug(F, '[getTSData] Getting data from TripSit API!');

  const data = await axios.get('https://raw.githubusercontent.com/TripSit/drugs/main/drugs.json');
  const drugData = data.data as {
    [key: string]: Drug;
  };

  log.info(F, `Got ${Object.values(drugData).length} drugs from TripSit API!`);

  await saveData(drugData, 'tripsitDB');

  return drugData;
}

async function getTSCombos(): Promise<Combos> {
  // Check if the cache exists, and if so, use it.

  if (useCache) {
    try {
      const rawData = fs.readFile(path.join(dataFolder, 'tripsitCombos.json'));
      log.debug(F, `Got ${Object.keys(rawData).length} drugs from TripSit Combo Cache!`);
      return JSON.parse(rawData.toString());
    } catch (err) {
      log.error(F, `Error reading TripSit Cache: ${err}`);
    }
  }

  const tsComboResponse = await axios.get('https://raw.githubusercontent.com/TripSit/drugs/main/combos.json');
  const tsComboData = tsComboResponse.data as Combos;

  // log.info(F, `Got ${Object.values(tsComboData).length} combos from TripSit API!`);

  await saveData(tsComboData, 'tripsitCombos');

  return tsComboData;
}

async function getPWData(): Promise<PwSubstance[]> {
  // log.debug(F, 'Starting!');
  if (useCache) {
    try {
      const rawData = fs.readFile(path.join(dataFolder, 'psychonautDB.json'));
      // log.debug(F, `Got ${Object.keys(rawData).length} drugs from Psychonaut Drug Cache!`);
      return JSON.parse(rawData.toString());
    } catch (err) {
      log.error(F, `Error reading TripSit Cache: ${err}`);
    }
  }

  const pwResponse = await new GraphQLClient('https://api.psychonautwiki.org').request(`
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
  `) as {
    substances: PwSubstance[];
  };

  const { substances } = pwResponse;

  // log.info(F, `Got ${substances.length} drugs from Psychonaut API!`);

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
    const roaEntry = combinedDrug.roas?.find(roa => roa.name === 'Oral') || {} as Roa;

    if (!roaEntry.duration) {
      roaEntry.duration = [];
    }

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
        const roaEntry = combinedDrug.roas?.find(roa => roa.name === durationKey) || {} as Roa;

        if (!roaEntry.duration) {
          roaEntry.duration = [];
        }

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
    const combinedDrug = combinedDb.find(drug => drug.name.toLowerCase() === pwDrug.name.toLowerCase()) || {} as CbSubstance;

    combinedDrug.url = pwDrug.url;
    // combinedDrug.experiencesUrl = // Tripsit only
    combinedDrug.name = pwDrug.name;
    combinedDrug.aliases = pwDrug.commonNames ?? undefined;
    combinedDrug.aliasesStr = pwDrug.commonNames ? pwDrug.commonNames.join(', ') : undefined;
    combinedDrug.summary = pwDrug.summary.length > 0 ? pwDrug.summary : undefined;
    // combinedDrug.reagents = // Tripsit only
    // combinedDrug.classes = pwDrug.class;
    combinedDrug.toxicity = pwDrug.toxicity ?? undefined;
    combinedDrug.addictionPotential = pwDrug.addictionPotential ?? undefined;
    combinedDrug.tolerance = pwDrug.tolerance ?? undefined;
    combinedDrug.crossTolerances = pwDrug.crossTolerances ?? undefined;

    if (pwDrug.roa) {
      // combinedDrug.roas = [];
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
              doseString = `${doseData} ${units}`;
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
              const duration = (pwRoa.duration as PwDuration)[durationName as keyof typeof pwRoa.duration];
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
            if (!combinedDrug.roas) {
              combinedDrug.roas = [] as Roa[];
            }
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

async function combineTs(
  tsData: {
    [key: string]: Drug;
  },
  combinedDb: CbSubstance[],
) {
  Object.keys(tsData).forEach(key => {
    const tsDrug = tsData[key as keyof typeof tsData] as Drug;

    // Check if the drug already exists in the combinedDb
    let combinedDrug = combinedDb.find(drug => drug.name.toLowerCase() === tsDrug.name.toLowerCase());

    // if (combinedDrug) {
    //   log.debug(F, `[combineData] ${tsDrug.name} already exists in the combined DB!`);
    // }

    if (!combinedDrug) {
      // log.debug(F, `(${combinedDbLength}) ${tsDrug.name} does not exist in the combined DB!`);
      combinedDb.push({
        name: tsDrug.name,
        url: `https://wiki.tripsit.me/wiki/${tsDrug.name}`,
      } as CbSubstance);

      combinedDrug = combinedDb.find(drug => drug.name.toLowerCase() === tsDrug.name.toLowerCase()) as CbSubstance;
    }

    if (tsDrug.links && tsDrug.links.experiences) {
      combinedDrug.experiencesUrl = tsDrug.links.experiences;
    }

    // combinedDrug.name = tsDrug.pretty_name;

    if (tsDrug.aliases) {
      // Go through combinedDrug.aliases and add any aliases that don't already exist
      if (!combinedDrug.aliases) {
        combinedDrug.aliases = [];
      }
      tsDrug.aliases.forEach(alias => {
        if (!combinedDrug?.aliases?.includes(alias)) {
          combinedDrug?.aliases?.push(alias);
        }
      });

      if (!combinedDrug.aliasesStr) {
        combinedDrug.aliasesStr = tsDrug.aliases.join(', ');
      }
      tsDrug.aliases.forEach(alias => {
        if (!combinedDrug?.aliasesStr?.includes(alias)) {
          (combinedDrug as CbSubstance).aliasesStr = `${(combinedDrug as CbSubstance).aliasesStr}, ${alias}`;
        }
      });
    }

    if (tsDrug.properties && tsDrug.properties.summary) {
      combinedDrug.summary = tsDrug.properties.summary;
    }

    if (tsDrug.properties && tsDrug.properties['test-kits']) {
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
        } else {
          log.info(F, `[combineTs] ${tsDrug.name} has an unrecognized category: ${mappedCategory}`);
          log.info(F, `Originally ${category} > ${mappedCategory}`);
        }
      });

      combinedDrug.classes = {
        psychoactive: psychoactiveList.sort() as [Psychoactive],
        chemical: chemicalList.sort() as [Chemical],
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
        const dose = tsDrug.formatted_dose as TsDose;
        Object.entries(dose).forEach(([doseRoa, dosage]) => {
          if (!combinedDrug) return;
          const roaEntry = combinedDrug.roas?.find(roa => roa.name === doseRoa) || {} as Roa;
          roaEntry.name = doseRoa;
          let roaNote = tsDrug.dose_note;

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

          // Sort the keys according to that order
          const sortedKeys = Object.keys(dosage).sort(
            (a, b) => strengths.indexOf(a) - strengths.indexOf(b),
          );

          // For each strength in the ROA
          sortedKeys.forEach(strength => {
            // Check if the strength already exists from PW and if so, skip it
            if (roaEntry.dosage?.find(doseVal => doseVal.name === strength as Strength)) {
              return;
            }

            const strengthData = dosage[strength as keyof typeof dosage] as string;

            if (strength.toLowerCase() === 'note') {
              roaNote = strengthData;
            } else {
              // This essentially looks for "(any digit) (optional dash) (any digit) (optional unit)"
              const regex = /(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?([a-zA-Z]+)?/;
              const match = RegExp(regex).exec(strengthData);

              // This is mostly for type-safety
              if (match) {
                // The minimum number is the first number to appear
                const strengthMinNumber = parseFloat(match[1]);

                // The max number m ay not appear at all
                const strengthMaxNumber = match[2]
                  ? parseFloat(match[2])
                  : null;

                if (!roaEntry.dosage) {
                  roaEntry.dosage = [];
                }

                const roaUnit = match[3] ? match[3] : '';
                const maxString = strengthMaxNumber ? `-${strengthMaxNumber}` : '';

                // Check if the strength is included as a Name value
                if (strengths.includes(strength as Strength)) {
                  roaEntry.dosage.push({
                    name: strength.slice(0, 1).toUpperCase() + strength.slice(1) as Strength,
                    value: `${strengthMinNumber}${maxString} ${roaUnit}`,
                    note: roaNote,
                  });
                } else {
                  log.info(F, `[combineTs] ${tsDrug.name} has an unrecognized strength: ${strength}`);
                }
              }
            }
          });
          if (!combinedDrug.roas) {
            combinedDrug.roas = [] as Roa[];
          }
          combinedDrug.roas.push(roaEntry);
        });
      }

      if (tsDrug.formatted_onset) {
        formatTsDuration(tsDrug.formatted_onset as TsDuration, 'Onset', combinedDrug);
      }
      if (tsDrug.formatted_duration) {
        formatTsDuration(tsDrug.formatted_duration as TsDuration, 'Duration', combinedDrug);
      }
      if (tsDrug.formatted_aftereffects) {
        formatTsDuration(tsDrug.formatted_aftereffects as TsDuration, 'After Effects', combinedDrug);
      }
    }

    if (tsDrug.combos) {
      combinedDrug.interactions = [];
      Object.keys(tsDrug.combos).forEach(comboName => {
        if (!tsDrug.combos) return;
        const combo = tsDrug.combos[comboName as keyof typeof tsDrug.combos];
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

        if (!combinedDrug) return;
        combinedDrug.interactions?.push(interactionEntry);
      });
    }
  });
}

export default async function updateDrugDb():Promise<void> {
  const combinedDb = [] as CbSubstance[];
  // Check if the assets folder exists and if not, create  it
  // if (!fs.existsSync(assetFolder)) {
  //   fs.mkdirSync(assetFolder);
  // }

  // // Check if the data folder exists and if not, create  it
  // if (!fs.existsSync(dataFolder)) {
  //   fs.mkdirSync(dataFolder);
  // }

  await getTSCombos();
  const pwData = await getPWData();
  // log.debug(F, `Got ${pwData.length} drugs from Psychonaut Wiki`);
  await combinePw(pwData, combinedDb);
  // const pwDrugs = combinedDb.length;
  // log.debug(F, `Added ${combinedDb.length} drugs to the combined DB!`);
  const tsData = await getTSData();
  // log.debug(F, `Got ${Object.keys(tsData).length} drugs from TripSit`);
  await combineTs(tsData, combinedDb);
  // log.debug(F, `Added ${combinedDb.length - pwDrugs} drugs to the combined DB (and merged the rest) !`);
  const filePath = await saveData(combinedDb, 'combinedDB');
  log.info(F, `Updated combinedDB of ${combinedDb.length} drugs to ${filePath}`);
}
