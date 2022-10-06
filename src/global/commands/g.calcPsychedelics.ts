import logger from '../utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * Does something
 * @param {number} lastDose
 * @param {number | null} desiredDose
 * @param {number} days
 */
export async function calcPsychedelics(
  lastDose:number,
  desiredDose:number | null,
  days:number,
):Promise<number> {
  logger.debug(`[${PREFIX}] lastDose: ${lastDose} | desiredDose: ${desiredDose} | days: ${days}`);
  let estimatedDosage = (lastDose / 100) * 280.059565 * (days ** -0.412565956);
  let newAmount = 0;
  if (desiredDose) {
    estimatedDosage += (desiredDose - lastDose);
    newAmount = ((estimatedDosage < desiredDose) ? desiredDose : estimatedDosage);
  } else {
    newAmount = ((estimatedDosage < lastDose) ? lastDose : estimatedDosage);
  }


  const result = Math.round(newAmount * 10) / 10;

  logger.debug(`[${PREFIX}] result: ${result}!`);

  return result;
};
