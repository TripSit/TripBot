import { parse } from 'path';

const F = f(__filename);

export default calcPsychedelics;

/**
 * Does something
 * @param {number} lastDose
 * @param {number} days
 * @param {number | null} desiredDose
 */
export async function calcPsychedelics(
  lastDose:number,
  days:number,
  desiredDose:number | null,
):Promise<number> {
  let estimatedDosage = (lastDose / 100) * 280.059565 * (days ** -0.412565956);
  let newAmount = 0;
  if (desiredDose) {
    estimatedDosage += (desiredDose - lastDose);
    newAmount = ((estimatedDosage < desiredDose) ? desiredDose : estimatedDosage);
  } else {
    newAmount = ((estimatedDosage < lastDose) ? lastDose : estimatedDosage);
  }

  const result = Math.round(newAmount * 10) / 10;

  log.info(F, `response: ${JSON.stringify(result, null, 2)}`);

  return result;
}
