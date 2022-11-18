import { parse } from 'path';
import { CbSubstance } from '../@types/combined.d';
import drugDataAll from '../assets/data/drug_db_combined.json';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default drug;

/**
 * @param {string} drugName
 * @return {CbSubstance | null}
 */
export async function drug(drugName:string):Promise<CbSubstance | null> {
  if (drugDataAll === null || drugDataAll === undefined) {
    return null;
  }

  let drugData = (drugDataAll as CbSubstance[]).find((substance) => substance.name === drugName);
  // log.debug(`[${PREFIX}] drugData1: ${JSON.stringify(drugData, null, 2)}`);
  if (!drugData) {
    drugData = (drugDataAll as CbSubstance[]).find((substance) => substance.name === drugName.toLowerCase());
    // log.debug(`[${PREFIX}] drugData2: ${JSON.stringify(drugData, null, 2)}`);
    if (!drugData) {
      drugData = (drugDataAll as CbSubstance[]).find((substance) => substance.name === drugName.toUpperCase());
      // log.debug(`[${PREFIX}] drugData3: ${JSON.stringify(drugData, null, 2)}`);
      if (!drugData) {
        return null;
      }
    }
  }

  log.info(`[${PREFIX}] response: ${JSON.stringify(drugData, null, 2)}`);
  return drugData;
}
