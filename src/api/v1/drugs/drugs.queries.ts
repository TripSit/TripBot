import { Category, Drug } from 'tripsit_drug_db';
import drugJsonData from '../../../../assets/data/tripsitDB.json';
import { combo } from '../../../global/commands/g.combo';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

type DrugData = {
  [key: string]: Drug;
};

const drugData = drugJsonData as DrugData;

// The rest of this code is copied from tripbot, with some minor modifications
// I did as few changes as possible to get rid of the critical errors to let this run
// I have no intention of updating this API, so I don't care if it's not perfect
// We will work on a new API with standardized data
export default {
  async getAllDrugs():Promise<DrugData> {
    return drugData as DrugData;
  },

  async getAllDrugNames():Promise<string[]> {
    return Object.keys(drugData);
  },

  async getAllDrugAliases():Promise<string[]> {
    return Object.values(drugData as DrugData)
      .filter((drug:Drug) => drug.aliases) // Filter drugs without aliases
      .map((drug:Drug) => drug.aliases) // Get aliases
      .flat() as string[]; // Flatten array, define as string[]
  },

  async getAllCategories():Promise<string[]> {
    return Array.from(new Set(Object.values(drugData as DrugData)
      .filter((drug:Drug) => drug.categories) // Filter drugs without categories
      .map((drug:Drug) => drug.categories) // Get categories
      .flat() // Flatten array
      .sort())) as string[]; // Sort and define as string[]
  },

  async getAllDrugNamesByCategory(category:string):Promise<string[] | {
    err: boolean;
    msg: string;
    options: string[];
  }> {
    const results = Object.values(drugData as DrugData)
      .filter((drug: Drug) => drug.categories && (
        drug.categories.includes(category as Category)
      || drug.categories.includes(category.toLowerCase() as Category)
      || drug.categories.includes(category.slice(0, -1) as Category)
      ))
      .map((drug: Drug) => drug.name)
      .sort() as string[];

    if (results.length > 0) {
      return results;
    }

    return {
      err: true,
      msg: `No drugs found with the ${category} category. Try one of:`,
      options: await this.getAllCategories(),
    };
  },

  async getDrug(drugName:string):Promise<Drug | {
    err: boolean;
    msg: string;
    options?: string[];
  }> {
    const drug = (drugData as DrugData)[drugName.toLowerCase()] as Drug;

    if (drug) {
      return drug;
    }
    return {
      err: true,
      msg: 'Drug with that name not found, please try again.',
      options: await this.getAllDrugNames(),
    };
  },

  async getInteraction(
    drugAInput:string,
    drugBInput:string,
  ):Promise<{
      result: string;
      interactionCategoryA: string;
      interactionCategoryB: string;
      definition: string;
      thumbnail: string;
      color: string;
      note?: string;
      // source?: string;
    } | {
      err: boolean;
      msg: string;
      options?: string[];
    }> {
    log.debug(F, `getInteraction | drugA: ${drugAInput}, drugB: ${drugBInput}`);
    return combo(drugAInput, drugBInput);
  },
};
