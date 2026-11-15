import {
  Category, ComboData, Drug, Combos, Interactions,
} from 'tripsit_drug_db';
import { stripIndents } from 'common-tags';
import comboJsonData from '../../../assets/data/tripsitCombos.json';
import drugJsonData from '../../../assets/data/tripsitDB.json';
import comboDefs from '../../../assets/data/combo_definitions.json';

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

export default combo;

// Drug names that are really a family of drugs. These matches need to come first because otherwise "2x-b"
// would be found in the drug DB but not have any interaction info
const PATTERN_CATEGORIES: [RegExp, string][] = [
  [/^do.$/i, 'dox'],
  [/^2c-.$/i, '2c-x'],
  [/^2c-t-.$/i, '2c-t-x'],
  [/^25.-nbome/i, 'nbomes'],
  [/^5-meo-..t$/i, '5-meo-xxt'],
];

const NAME_CATEGORIES: Record<string, string> = {
  ghb: 'ghb/gbl',
  gbl: 'ghb/gbl',
  ssri: 'ssris',
  snri: 'ssris',
  snris: 'ssris',
  maoi: 'maois',
};

// Drug categories that have their own interaction class
const DRUG_CATEGORY_CLASSES: [string, string][] = [
  ['benzodiazepine', 'benzodiazepines'],
  ['opioid', 'opioids'],
  ['ssri', 'ssris'],
];

/** Resolves aliases (e.g. 'dxm') to their canonical drug database key, same pattern as g.drug.ts. */
function resolveAlias(drugName: string): string {
  if (Object.keys(drugData).includes(drugName.toLowerCase())) return drugName;
  const canonicalKey = Object.keys(drugData).find(
    key => drugData[key].aliases?.map(alias => alias.toLowerCase())
      .includes(drugName.toLowerCase()),
  );
  return canonicalKey ?? drugName;
}

/** Looks at a known drug's aliases and categories to find the interaction class it belongs to. */
function classOfKnownDrug(drugName: string): string | undefined {
  if (!Object.keys(drugData).includes(drugName.toLowerCase())) return undefined;
  const drug = drugData[drugName.toLowerCase()];
  if (drug.aliases?.join().includes('amphetamine')) {
    return 'amphetamines';
  }
  // Otherwise, check the categories
  const categoryClass = DRUG_CATEGORY_CLASSES.find(([category]) => drug.categories?.includes(category as Category));
  return categoryClass?.[1];
}

// Because users can input whatever they want, we need to clean the input
function cleanDrugName(drugNameInput: string): string {
  const drugName = resolveAlias(drugNameInput);

  const patternCategory = PATTERN_CATEGORIES.find(([pattern]) => pattern.test(drugName));
  if (patternCategory) return patternCategory[1];
  if (Object.hasOwn(NAME_CATEGORIES, drugName)) return NAME_CATEGORIES[drugName];

  // If the drug is not in the drug database, check the combo database
  if (Object.keys(comboData).includes(drugName.toLowerCase())) {
    return drugName.toLowerCase();
  }

  // Convert any of the following to their respective categories
  if (drugName.includes('amphetamine' as Category)) {
    return 'amphetamines';
  }

  return classOfKnownDrug(drugName) ?? drugName;
}

/**
 * If the drug is in the drugDB, we can use the combo data from there
 * If the drug is not in the drugDB, we can use the combo data from the comboDB
 * Either way, it's the same format, so they're interchangeable
 */
function getComboData(drugName: string) {
  return Object.keys(drugData).includes(drugName.toLowerCase())
    ? drugData[drugName.toLowerCase()].combos
    : comboData[drugName.toLowerCase() as keyof typeof comboData];
}

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

  // This part is the fun part
  const drugAComboData = getComboData(drugAName);

  // We use this to show the user all the drugs they can use
  const allDrugNames = Object.values(drugData)
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

  const drugBComboData = getComboData(drugBName);

  if (!drugBComboData) {
    return {
      err: true,
      msg: `${drugBInput} not found. Try one of:`,
      options: allDrugNames,
    };
  }

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

  const comboDef = comboDefs.find(def => def.status === comboInfo.status) as ComboDef;

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
