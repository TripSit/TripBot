import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

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
  // log.debug(`[${PREFIX}] dosage: ${dosage} | drug_a: ${drugA} | drug_b: ${drugB}`);

  if (drugDataTripsit === null || drugDataTripsit === undefined) {
    log.error(`[${PREFIX}] drugDataAll is null or undefined`);
    return;
  }

  const drugDataA = drugDataTripsit[drugA as keyof typeof drugDataTripsit];

  if (!drugDataA) {
    log.error(`[${PREFIX}] ${drugA} was not found in drugDataTripsit`);
    return;
  }

  if (!drugDataA.properties.hasOwnProperty('dose_to_diazepam')) {
    log.error(`[${PREFIX}] ${drugA} does not have a dose_to_diazepam property`);
    return;
  }

  const regex = /[0-9]+\.?[0-9]?/;
  const convertedDoseA = regex.exec(drugDataA.properties['dose_to_diazepam' as keyof typeof drugDataA.properties]);
  if (!convertedDoseA) {
    log.error(`[${PREFIX}] ${drugA} dose_to_diazepam property is not a number`);
    return;
  }

  const drugDataB = drugDataTripsit[drugB as keyof typeof drugDataTripsit];

  if (!drugDataB) {
    log.error(`[${PREFIX}] ${drugB} was not found in drugDataTripsit`);
    return;
  }

  if (!drugDataB.properties.hasOwnProperty('dose_to_diazepam')) {
    log.error(`[${PREFIX}] ${drugB} does not have a dose_to_diazepam property`);
    return;
  }

  const convertedDoseB = regex.exec(drugDataB.properties['dose_to_diazepam' as keyof typeof drugDataB.properties]);
  // log.debug(`[${PREFIX}] convertedDoseA: ${convertedDoseA}`);
  // log.debug(`[${PREFIX}] convertedDoseA: ${convertedDoseA.toString()}`);
  // log.debug(`[${PREFIX}] convertedDoseA: ${parseFloat(convertedDoseA.toString())}`);
  // log.debug(`[${PREFIX}] convertedDoseB: ${convertedDoseB}`);
  // log.debug(`[${PREFIX}] convertedDoseB: ${convertedDoseB.toString()}`);
  // log.debug(`[${PREFIX}] convertedDoseB: ${parseFloat(convertedDoseB.toString())}`);
  // log.debug(`[${PREFIX}] dosage: ${dosage}`);
  // log.debug(`[${PREFIX}] dosage1: ${dosage / parseFloat(convertedDoseA.toString())}`);
  // log.debug(`[${PREFIX}] dosage2: ${parseFloat(convertedDoseA.toString()) *
  // parseFloat(convertedDoseB.toString())}`);

  if (!convertedDoseB) {
    log.error(`[${PREFIX}] ${drugB} dose_to_diazepam property is not a number`);
    return;
  }

  const result = (dosage / parseFloat(convertedDoseA.toString())) * parseFloat(convertedDoseB.toString());
  log.info(`[${PREFIX}] response: ${JSON.stringify(result, null, 2)}`);
  return result;
};
