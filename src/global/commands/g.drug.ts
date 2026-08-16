import { CbSubstance } from '../@types/combined';
import drugDataAll from '../../../assets/data/combinedDB.json';

const F = f(__filename);

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
      log.debug(F, `Drug not found: ${drugName}`);
      return drugData;
    }
  }

  return drugData;
}
