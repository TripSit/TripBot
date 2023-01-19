import { CbSubstance } from '../@types/combined.d';
import drugDataAll from '../assets/data/drug_db_combined.json';

const F = f(__filename); // eslint-disable-line

export default drug;

/**
 * @param {string} drugName
 * @return {CbSubstance | null}
 */
export async function drug(drugName:string):Promise<CbSubstance | null> {
  if (drugDataAll === null || drugDataAll === undefined) {
    return null;
  }

  let drugData = (drugDataAll as CbSubstance[]).find(
    substance => substance.name.toLowerCase() === drugName.toLowerCase(),
  );
  if (!drugData) {
    drugData = (drugDataAll as CbSubstance[]).find(
      substance => substance.aliases?.map(alias => alias.toLowerCase()).includes(
        drugName.toLowerCase(),
      ),
    );
    if (!drugData) {
      return null;
    }
  }

  // log.info(F, `response: ${JSON.stringify(drugData, null, 2)}`);
  return drugData;
}
