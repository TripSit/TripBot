import { parse } from 'path';
import log from '../utils/log';

import drugDataTripsit from '../assets/data/drug_db_tripsit.json';

const PREFIX = parse(__filename).name;

export default calcBenzo;

/**
 * Calculate benzo dosages
 * @param {number} dosage
 * @param {string} drugA
 * @param {string} drugB
 * @return {Promise<string | number>}
 */
export async function calcBenzo(
  dosage:number,
  drugA:string,
  drugB:string,
):Promise<string | number> {
  // log.debug(`[${PREFIX}] dosage: ${dosage} | drug_a: ${drugA} | drug_b: ${drugB}`);

  // if (drugDataTripsit === null || drugDataTripsit === undefined) {
  //   log.error(`[${PREFIX}] drugDataAll is null or undefined`);
  //   return;
  // }

  const drugDataA = drugDataTripsit[drugA as keyof typeof drugDataTripsit];

  if (!drugDataA) {
    const response = `${drugA} was not found in db, did you spell that right?`;
    log.error(`[${PREFIX}] ${response}`);
    return response;
  }

  if (!Object.prototype.hasOwnProperty.call(drugDataA.properties, 'dose_to_diazepam')) {
    const response = `${drugA} does not have a conversion property, you should not have been able to select this!`;
    log.error(`[${PREFIX}] ${response}`);
    return response;
  }

  const regex = /[0-9]+\.?[0-9]?/;
  const convertedDoseA = regex.exec(drugDataA.properties['dose_to_diazepam' as keyof typeof drugDataA.properties]);
  if (!convertedDoseA) {
    const response = `${drugA} dose_to_diazepam property is not a number, this should not have happened!`;
    log.error(`[${PREFIX}] ${response}`);
    return response;
  }

  const drugDataB = drugDataTripsit[drugB as keyof typeof drugDataTripsit];

  if (!drugDataB) {
    const response = `${drugB} was not found in db, did you spell that right?`;
    log.error(`[${PREFIX}] ${response}`);
    return response;
  }

  if (!Object.prototype.hasOwnProperty.call(drugDataB.properties, 'dose_to_diazepam')) {
    const response = `${drugB} does not have a conversion property, you should not have been able to select this!`;
    log.error(`[${PREFIX}] ${response}`);
    return response;
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
    const response = `${drugB} dose_to_diazepam property is not a number, this should not have happened!`;
    log.error(`[${PREFIX}] ${response}`);
    return response;
  }

  const result = (dosage / parseFloat(convertedDoseA.toString())) * parseFloat(convertedDoseB.toString());
  log.info(`[${PREFIX}] response: ${JSON.stringify(result, null, 2)}`);
  return result;
}
