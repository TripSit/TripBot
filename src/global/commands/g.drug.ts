import type { CbSubstance as CallbackSubstance } from '../@types/combined';

import drugDataAll from '../../../assets/data/combinedDB.json';

const F = f(__filename); // eslint-disable-line

export default drug;

export async function drug(drugName: string): Promise<CallbackSubstance | undefined> {
  let drugData = (drugDataAll as CallbackSubstance[]).find(
    (substance) => substance.name.toLowerCase() === drugName.toLowerCase(),
  );
  if (!drugData) {
    drugData = (drugDataAll as CallbackSubstance[]).find((substance) =>
      substance.aliases?.map((alias) => alias.toLowerCase()).includes(drugName.toLowerCase()),
    );
    if (!drugData) {
      return drugData;
    }
  }

  // log.info(F, `response: ${JSON.stringify(drugData, null, 2)}`);
  return drugData;
}
