import logger from '../utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

import drugDataTripsit from '../assets/data/drug_db_tripsit.json';

/**
 * Calculate benzo dosages
 * @param {number} dosage
 * @param {string} drugA
 * @param {string} drugB
 * @return {Promise<any>}
 */
export async function calcBenzo(
  dosage:number,
  drugA:string,
  drugB:string,
):Promise<any> {
  logger.debug(`[${PREFIX}] dosage: ${dosage} | drug_a: ${drugA} | drug_b: ${drugB}`);

  if (drugDataTripsit === null || drugDataTripsit === undefined) {
    logger.error(`[${PREFIX}] drugDataAll is null or undefined`);
    return;
  }

  const drugDataA = drugDataTripsit[drugA as keyof typeof drugDataTripsit];

  if (!drugDataA) {
    logger.error(`[${PREFIX}] ${drugA} was not found in drugDataTripsit`);
    return;
  }

  if (!drugDataA.properties.hasOwnProperty('dose_to_diazepam')) {
    logger.error(`[${PREFIX}] ${drugA} does not have a dose_to_diazepam property`);
    return;
  }

  const regex = /[0-9]+\.?[0-9]?/;
  const convertedDoseA = regex.exec(drugDataA.properties['dose_to_diazepam' as keyof typeof drugDataA.properties])!;

  const drugDataB = drugDataTripsit[drugB as keyof typeof drugDataTripsit];

  if (!drugDataB) {
    logger.error(`[${PREFIX}] ${drugB} was not found in drugDataTripsit`);
    return;
  }

  if (!drugDataB.properties.hasOwnProperty('dose_to_diazepam')) {
    logger.error(`[${PREFIX}] ${drugB} does not have a dose_to_diazepam property`);
    return;
  }

  const convertedDoseB = regex.exec(drugDataB.properties['dose_to_diazepam' as keyof typeof drugDataB.properties])!;
  // logger.debug(`[${PREFIX}] convertedDoseA: ${convertedDoseA}`);
  // logger.debug(`[${PREFIX}] convertedDoseA: ${convertedDoseA.toString()}`);
  // logger.debug(`[${PREFIX}] convertedDoseA: ${parseFloat(convertedDoseA.toString())}`);
  // logger.debug(`[${PREFIX}] convertedDoseB: ${convertedDoseB}`);
  // logger.debug(`[${PREFIX}] convertedDoseB: ${convertedDoseB.toString()}`);
  // logger.debug(`[${PREFIX}] convertedDoseB: ${parseFloat(convertedDoseB.toString())}`);
  // logger.debug(`[${PREFIX}] dosage: ${dosage}`);
  // logger.debug(`[${PREFIX}] dosage1: ${dosage / parseFloat(convertedDoseA.toString())}`);
  // logger.debug(`[${PREFIX}] dosage2: ${parseFloat(convertedDoseA.toString()) *
  // parseFloat(convertedDoseB.toString())}`);

  const result = (dosage / parseFloat(convertedDoseA.toString())) * parseFloat(convertedDoseB.toString());
  logger.debug(`[${PREFIX}] result: ${result}`);
  return result;
};
