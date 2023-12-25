import { CbSubstance } from '../@types/combined';
import drugDataAll from '../../../assets/data/combinedDB.json';

const F = f(__filename); // eslint-disable-line

export default drug;

export async function drug(drugName:string):Promise<CbSubstance | undefined> {
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
      return drugData;
    }
  }

  // log.info(F, `response: ${JSON.stringify(drugData, null, 2)}`);
  return drugData;
}
