import { parse } from 'path';
import { CbSubstance } from '../@types/combined.d';
import drugDataAll from '../assets/data/drug_db_combined.json';

const F = f(__filename);

export default drug;

/**
 * @param {string} drugName
 * @return {CbSubstance | null}
 */
export async function drug(drugName:string):Promise<CbSubstance | null> {
  if (drugDataAll === null || drugDataAll === undefined) {
    return null;
  }

  let drugData = (drugDataAll as CbSubstance[]).find(substance => substance.name === drugName);
  // log.debug(F, `drugData1: ${JSON.stringify(drugData, null, 2)}`);
  if (!drugData) {
    drugData = (drugDataAll as CbSubstance[]).find(substance => substance.name === drugName.toLowerCase());
    // log.debug(F, `drugData2: ${JSON.stringify(drugData, null, 2)}`);
    if (!drugData) {
      drugData = (drugDataAll as CbSubstance[]).find(substance => substance.name === drugName.toUpperCase());
      // log.debug(F, `drugData3: ${JSON.stringify(drugData, null, 2)}`);
      if (!drugData) {
        return null;
      }
    }
  }

  log.info(F, `response: ${JSON.stringify(drugData, null, 2)}`);
  return drugData;
}
