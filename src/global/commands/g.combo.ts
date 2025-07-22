// import { stripIndents } from 'common-tags';
import type { Category, ComboData, Combos, Drug, Interactions } from 'tripsit_drug_db';

// import { CbSubstance, Interaction } from '../@types/combined';
// import drugDataAll from '../../../assets/data/combine dDB.json';
import { stripIndents } from 'common-tags';

import type { ComboDefinition, DrugData } from '../@types/tripsit';

import comboDefs from '../../../assets/data/combo_definitions.json';
import comboJsonData from '../../../assets/data/tripsitCombos.json';
import drugJsonData from '../../../assets/data/tripsitDB.json';

const F = f(__filename);

const drugData = drugJsonData as DrugData;
const comboData = comboJsonData as Combos;
const comboDefinitions = comboDefs as ComboDefinition[];

// const devMsg = '...this shouldn\'t have happened, please tell the developer!';

export default combo;

export function combo(
  drugAInput: string,
  drugBInput: string,
):
  | {
      color: string;
      definition: string;
      emoji: string;
      interactionCategoryA: string;
      interactionCategoryB: string;
      note?: string;
      result: string;
      sources?: {
        author: string;
        title: string;
        url: string;
      }[];
      thumbnail: string;
    }
  | {
      err: boolean;
      msg: string;
      options?: string[];
    } {
  let drugAName = drugAInput.toLowerCase();
  let drugBName = drugBInput.toLowerCase();

  // Because users can input whatever they want, we need to clean the input
  function cleanDrugName(drugName: string): string {
    // These matches need to come first because otherwise "2x-b" woould be found in the drug DB but not have any interaction info
    if (/^do.$/i.test(drugName)) {
      return 'dox';
    }
    if (/^2c-.$/i.test(drugName)) {
      return '2c-x';
    }
    if (/^25.-nbome/i.test(drugName)) {
      return '2c-t-x';
    }
    if (/^25.-nbome/i.test(drugName)) {
      return 'nbomes';
    }
    if (/^5-meo-..t$/i.test(drugName)) {
      return '5-meo-xxt';
    }
    if (drugName === 'ghb' || drugName === 'gbl') {
      return 'ghb/gbl';
    }
    if (drugName === 'ssri' || drugName === 'snri' || drugName === 'snris') {
      return 'ssris';
    }
    if (drugName === 'maoi') {
      return 'maois';
    }

    // First, check if the given name exists in the drug database, if so, we should try to use that info
    if (Object.keys(drugData).includes(drugName.toLowerCase())) {
      const drug = drugData[drugName.toLowerCase()];

      // If the drug has combo data, try to use that first
      if (drug.combos && Object.keys(drug.combos).includes(drugName.toLowerCase())) {
        return drugName.toLowerCase();
      }
    }

    // If the drug is not in the drug database, check the combo database
    if (Object.keys(comboData).includes(drugName.toLowerCase())) {
      return drugName.toLowerCase();
    }

    // Convert any of the following to their respective categories
    if (drugName.includes('amphetamine' as Category)) {
      return 'amphetamines';
    }

    if (Object.keys(drugData).includes(drugName.toLowerCase())) {
      const drug = drugData[drugName.toLowerCase()];
      if (drug.aliases?.join(',').includes('amphetamine') === true) {
        return 'amphetamines';
      }
    }

    if (Object.keys(drugData).includes(drugName.toLowerCase())) {
      const drug = drugData[drugName.toLowerCase()];

      // Otherwise, check the categories
      if (drug.categories) {
        if (drug.categories.includes('benzodiazepine' as Category)) {
          return 'benzodiazepines';
        }
        if (drug.categories.includes('opioid' as Category)) {
          return 'opioids';
        }
        if (drug.categories.includes('ssri' as Category)) {
          return 'ssris';
        }
      }
    }

    return drugName;
  }

  drugAName = cleanDrugName(drugAName);
  drugBName = cleanDrugName(drugBName);

  log.debug(F, `drugAName: ${drugAName}`);
  log.debug(F, `drugBName: ${drugBName}`);

  const drugANameString = drugAInput === drugAName ? '' : ` (converted to '${drugAName}')`;
  const drugBNameString = drugBInput === drugBName ? '' : ` (converted to '${drugBName}')`;

  if (drugAName === drugBName) {
    return {
      err: true,
      msg: stripIndents`${drugAInput}${drugANameString} and ${drugBInput}${drugBNameString} are the same drug/class.
      Drugs in the same class tend to potentiate each other, so this may not be a good idea.
      Please do additional research before combining these drugs.`,
    };
  }

  // This part is the fun part:
  // If the drug is in the drugDB, we can use the combo data from there
  // If the drug is not in the drugDB, we can use the combo data from the comboDB
  // Either way, it's the same format, so they're interchangeable
  // log.debug(F, `drugAName: ${drugAName}`);
  const drugAComboData = Object.keys(drugData).includes(drugAName.toLowerCase())
    ? drugData[drugAName.toLowerCase()].combos
    : comboData[drugAName.toLowerCase() as keyof typeof comboData];

  // We use this to show the user all the drugs they can use
  const allDrugNames = Object.values(drugData)
    .filter((drug: Drug) => drug.aliases) // Filter drugs without aliases
    .flatMap((drug: Drug) => drug.aliases) as string[]; // Flatten array, define as string[]

  if (!drugAComboData) {
    return {
      err: true,
      msg: `${drugAInput} not found. Try one of:`,
      options: allDrugNames,
    };
  }
  // log.debug(F, `drugAComboData: ${JSON.stringify(drugAComboData)}`);

  const drugBComboData = Object.keys(drugData).includes(drugBName.toLowerCase())
    ? drugData[drugBName.toLowerCase()].combos
    : comboData[drugBName.toLowerCase() as keyof typeof comboData];

  if (!drugBComboData) {
    return {
      err: true,
      msg: `${drugBInput} not found. Try one of:`,
      options: allDrugNames,
    };
  }
  // log.debug(F, `drugBComboData: ${JSON.stringify(drugBComboData)}`);

  let comboInfo: ComboData | undefined = undefined;
  // Check if drugB is in drugA's combo list
  if (Object.keys(drugAComboData).includes(drugBName)) {
    comboInfo = drugAComboData[drugBName as keyof Interactions];
  } else if (Object.keys(drugBComboData).includes(drugAName)) {
    comboInfo = drugBComboData[drugAName as keyof Interactions];
  } else {
    // If we get here, there is no combo data for these drugs
    return {
      err: true,
      msg: `No combo data found for ${drugAInput} and ${drugBInput}.`,
    };
  }

  if (!comboInfo) {
    return {
      err: true,
      msg: `No combo data found for ${drugAInput} and ${drugBInput}.`,
    };
  }

  // log.debug(F, `comboInfo: ${JSON.stringify(comboInfo)}`);

  const comboDefinition = comboDefinitions.find(
    (definition) => definition.status === comboInfo.status,
  );

  if (!comboDefinition) {
    return {
      err: true,
      msg: `No combo definition found for ${comboInfo.status}.`,
    };
  }

  // log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

  return {
    color: comboDefinition.color,
    definition: comboDefinition.definition,
    emoji: comboDefinition.emoji,
    interactionCategoryA: drugAName,
    interactionCategoryB: drugBName,
    note: comboInfo.note,
    result: comboInfo.status,
    sources: comboInfo.sources,
    thumbnail: comboDefinition.thumbnail,
  };
}
