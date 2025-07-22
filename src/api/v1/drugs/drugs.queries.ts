import type { Category, Drug } from 'tripsit_drug_db';

import drugJsonData from '../../../../assets/data/tripsitDB.json';
import { combo } from '../../../global/commands/g.combo';

const F = f(__filename);

type DrugData = Record<string, Drug>;

const drugData = drugJsonData as DrugData;

// The rest of this code is copied from tripbot, with some minor modifications
// I did as few changes as possible to get rid of the critical errors to let this run
// I have no intention of updating this API, so I don't care if it's not perfect
// We will work on a new API with standardized data
export default {
  getAllCategories(): string[] {
    return [
      ...new Set(
        Object.values(drugData)
          .filter((drug: Drug) => drug.categories) // Filter drugs without categories
          .flatMap((drug: Drug) => drug.categories) // Flatten array
          .sort(),
      ),
    ] as string[]; // Sort and define as string[]
  },

  getAllDrugAliases(): string[] {
    return Object.values(drugData)
      .filter((drug: Drug) => drug.aliases) // Filter drugs without aliases
      .flatMap((drug: Drug) => drug.aliases) as string[]; // Flatten array, define as string[]
  },

  getAllDrugNames(): string[] {
    return Object.keys(drugData);
  },

  getAllDrugNamesByCategory(category: string):
    | string[]
    | {
        err: boolean;
        msg: string;
        options: string[];
      } {
    const results = Object.values(drugData)
      .filter((drug: Drug) =>
        Boolean(
          drug.categories &&
            drug.categories.length > 0 &&
            (drug.categories.includes(category as Category) ||
              drug.categories.includes(category.toLowerCase() as Category) ||
              drug.categories.includes(category.slice(0, -1) as Category)),
        ),
      )
      .map((drug: Drug) => drug.name)
      .sort();

    if (results.length > 0) {
      return results;
    }

    return {
      err: true,
      msg: `No drugs found with the ${category} category. Try one of:`,
      options: this.getAllCategories(),
    };
  },

  getAllDrugs(): DrugData {
    return drugData;
  },

  getDrug(drugName: string):
    | Drug
    | {
        err: boolean;
        msg: string;
        options?: string[];
      } {
    const drug: Drug | undefined = drugData[drugName.toLowerCase()];

    return drug;
    return {
      err: true,
      msg: 'Drug with that name not found, please try again.',
      options: this.getAllDrugNames(),
    };
  },

  getInteraction(
    drugAInput: string,
    drugBInput: string,
  ):
    | {
        color: string;
        definition: string;
        interactionCategoryA: string;
        interactionCategoryB: string;
        note?: string;
        result: string;
        thumbnail: string;
        // source?: string;
      }
    | {
        err: boolean;
        msg: string;
        options?: string[];
      } {
    log.debug(F, `getInteraction | drugA: ${drugAInput}, drugB: ${drugBInput}`);
    return combo(drugAInput, drugBInput);
  },
};
