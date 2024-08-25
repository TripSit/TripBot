// import { stripIndents } from 'common-tags';
import {
  Category, ComboData, Drug, Combos, Interactions,
} from 'tripsit_drug_db';
// import { CbSubstance, Interaction } from '../@types/combined';
// import drugDataAll from '../../../assets/data/combine dDB.json';
import { stripIndents } from 'common-tags';
import comboJsonData from '../../../assets/data/tripsitCombos.json';
import drugJsonData from '../../../assets/data/tripsitDB.json';
import comboDefs from '../../../assets/data/combo_definitions.json';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

type DrugData = {
  [key: string]: Drug;
};

type ComboDef = {
  status: string;
  emoji: string;
  color: string;
  definition: string;
  thumbnail: string;
};

const drugData = drugJsonData as DrugData;
const comboData = comboJsonData as Combos;

// const devMsg = '...this shouldn\'t have happened, please tell the developer!';

export default combo;

export async function combo(
  drugAInput: string,
  drugBInput: string,
): Promise<{
    err: boolean;
    msg: string;
    options?: string[];
  } | {
    result: string;
    definition: string;
    thumbnail: string;
    color: string;
    emoji: string;
    interactionCategoryA: string;
    interactionCategoryB: string;
    note?: string;
    sources?: {
      author: string;
      title: string;
      url: string;
    }[];
  }> {
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
      const drug = (drugData as DrugData)[drugName.toLowerCase()] as Drug;

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
      const drug = (drugData as DrugData)[drugName.toLowerCase()] as Drug;
      if (drug.aliases?.join().includes('amphetamine')) {
        return 'amphetamines';
      }
    }

    if (Object.keys(drugData).includes(drugName.toLowerCase())) {
      const drug = (drugData as DrugData)[drugName.toLowerCase()] as Drug;

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

  const drugANameString = drugAInput !== drugAName ? ` (converted to '${drugAName}')` : '';
  const drugBNameString = drugBInput !== drugBName ? ` (converted to '${drugBName}')` : '';

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
    ? (drugData[drugAName.toLowerCase()]).combos
    : comboData[drugAName.toLowerCase() as keyof typeof comboData];

  // We use this to show the user all the drugs they can use
  const allDrugNames = Object.values(drugData as DrugData)
    .filter((drug: Drug) => drug.aliases) // Filter drugs without aliases
    .map((drug: Drug) => drug.aliases) // Get aliases
    .flat() as string[]; // Flatten array, define as string[]

  if (!drugAComboData) {
    return {
      err: true,
      msg: `${drugAInput} not found. Try one of:`,
      options: allDrugNames,
    };
  }
  // log.debug(F, `drugAComboData: ${JSON.stringify(drugAComboData)}`);

  const drugBComboData = Object.keys(drugData).includes(drugBName.toLowerCase())
    ? (drugData[drugBName.toLowerCase()]).combos
    : comboData[drugBName.toLowerCase() as keyof typeof comboData];

  if (!drugBComboData) {
    return {
      err: true,
      msg: `${drugBInput} not found. Try one of:`,
      options: allDrugNames,
    };
  }
  // log.debug(F, `drugBComboData: ${JSON.stringify(drugBComboData)}`);

  let comboInfo = {} as ComboData;
  // Check if drugB is in drugA's combo list
  if (Object.keys(drugAComboData).includes(drugBName)) {
    comboInfo = drugAComboData[drugBName as keyof Interactions] as ComboData;
  } else if (Object.keys(drugBComboData).includes(drugAName)) {
    comboInfo = drugBComboData[drugAName as keyof Interactions] as ComboData;
  } else {
    // If we get here, there is no combo data for these drugs
    return {
      err: true,
      msg: `No combo data found for ${drugAInput} and ${drugBInput}.`,
    };
  }

  // log.debug(F, `comboInfo: ${JSON.stringify(comboInfo)}`);

  const comboDef = comboDefs.find(def => def.status === comboInfo.status) as ComboDef;

  // log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

  return {
    result: comboInfo.status,
    interactionCategoryA: drugAName,
    interactionCategoryB: drugBName,
    definition: comboDef.definition,
    thumbnail: comboDef.thumbnail,
    color: comboDef.color,
    emoji: comboDef.emoji,
    note: comboInfo.note,
    sources: comboInfo.sources,
  };
}
