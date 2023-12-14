import drugDataTripsit from '../../../assets/data/drug_db_tripsit.json';

const F = f(__filename);

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
):Promise<number> {
  // log.debug(F, `dosage: ${dosage} | drug_a: ${drugA} | drug_b: ${drugB}`);

  // if (drugDataTripsit === null || drugDataTripsit === undefined) {
  //   log.error(F, `drugDataAll is null or undefined`);
  //   return;
  // }

  const drugDataA = drugDataTripsit[drugA as keyof typeof drugDataTripsit];

  if (!drugDataA) {
    const response = `${drugA} was not found in db, did you spell that right?`;
    log.error(F, `${response}`);
    return -1;
  }

  if (!Object.prototype.hasOwnProperty.call(drugDataA.properties, 'dose_to_diazepam')) {
    const response = `${drugA} does not have a conversion property, you should not have been able to select this!`;
    log.error(F, `${response}`);
    return -1;
  }

  const regex = /\d+\.?\d?/;
  const convertedDoseA = regex.exec(drugDataA.properties['dose_to_diazepam' as keyof typeof drugDataA.properties]) as RegExpExecArray; // eslint-disable-line max-len

  const drugDataB = drugDataTripsit[drugB as keyof typeof drugDataTripsit];

  if (!drugDataB) {
    const response = `${drugB} was not found in db, did you spell that right?`;
    log.error(F, `${response}`);
    return -1;
  }

  if (!Object.prototype.hasOwnProperty.call(drugDataB.properties, 'dose_to_diazepam')) {
    const response = `${drugB} does not have a conversion property, you should not have been able to select this!`;
    log.error(F, `${response}`);
    return -1;
  }

  const convertedDoseB = regex.exec(drugDataB.properties['dose_to_diazepam' as keyof typeof drugDataB.properties]) as RegExpExecArray; // eslint-disable-line max-len
  // log.debug(F, `convertedDoseA: ${convertedDoseA}`);
  // log.debug(F, `convertedDoseA: ${convertedDoseA.toString()}`);
  // log.debug(F, `convertedDoseA: ${parseFloat(convertedDoseA.toString())}`);
  // log.debug(F, `convertedDoseB: ${convertedDoseB}`);
  // log.debug(F, `convertedDoseB: ${convertedDoseB.toString()}`);
  // log.debug(F, `convertedDoseB: ${parseFloat(convertedDoseB.toString())}`);
  // log.debug(F, `dosage: ${dosage}`);
  // log.debug(F, `dosage1: ${dosage / parseFloat(convertedDoseA.toString())}`);
  // log.debug(F, `dosage2: ${parseFloat(convertedDoseA.toString()) *
  // parseFloat(convertedDoseB.toString())}`);

  const result = (dosage / parseFloat(convertedDoseA.toString())) * parseFloat(convertedDoseB.toString());
  const rounded = Math.round(result * 100) / 100;
  log.info(F, `response: ${JSON.stringify(rounded, null, 2)}`);
  return rounded;
}
