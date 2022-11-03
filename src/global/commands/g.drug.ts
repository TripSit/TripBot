import {CbSubstance} from '../@types/combined.d';
import drugDataAll from '../assets/data/drug_db_combined.json';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * @param {string} drugName
 * @return {CbSubstance | null}
 */
export async function drug(drugName:string):Promise<CbSubstance | null> {
  logger.debug(`[${PREFIX}] started | drugName: ${drugName}`);

  if (drugDataAll === null || drugDataAll === undefined) {
    return null;
  }

  let drugData = (drugDataAll as CbSubstance[]).find((drug) => drug.name === drugName);
  // logger.debug(`[${PREFIX}] drugData1: ${JSON.stringify(drugData, null, 2)}`);
  if (!drugData) {
    drugData = (drugDataAll as CbSubstance[]).find((drug) => drug.name === drugName.toLowerCase());
    // logger.debug(`[${PREFIX}] drugData2: ${JSON.stringify(drugData, null, 2)}`);
    if (!drugData) {
      drugData = (drugDataAll as CbSubstance[]).find((drug) => drug.name === drugName.toUpperCase());
      // logger.debug(`[${PREFIX}] drugData3: ${JSON.stringify(drugData, null, 2)}`);
      if (!drugData) {
        return null;
      }
    }
  }

  // logger.debug(`[${PREFIX}] drugData: ${JSON.stringify(drugData, null, 2)}`);
  return drugData;
};
