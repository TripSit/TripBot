import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Calculates ketamine dosages
 * @param {number} weight Weight in lbs
 * @param {'lbs' | 'kg'} unit
 * @return {any} Something
 */
export async function calcKetamine(weight:number, unit:'lbs' | 'kg'):Promise<any> {
  const calcWeight = unit === 'kg' ? weight * 2.20462 : weight;

  const data = {
    insufflated: await generateInsufflatedDosages(calcWeight),
    rectal: await generateRectalDosages(calcWeight),
  };

  log.info(`[${PREFIX}] response: ${JSON.stringify(data, null, 2)}`);
  return data;
};

/**
 * Calculates insuffilated dosages
 * @param {number} weightInLbs Weight in lbs
 * @return {any} Something
 */
export async function generateInsufflatedDosages(weightInLbs:number):Promise<any> {
  // log.debug(`[${PREFIX}] **Threshold**: ${Math.round(weightInLbs * 0.1)}mg`);
  return [
    `**Threshold**: ${Math.round(weightInLbs * 0.1)}mg`,
    `**Light**: ${Math.round(weightInLbs * 0.15)}mg`,
    `**Common**: ${Math.round(weightInLbs * 0.3)}mg`,
    `**Strong**: ${Math.round(weightInLbs * 0.5)}-${Math.round(weightInLbs * 0.75)}mg`,
    `**K-hole**: ${weightInLbs}mg`,
  ]
    .join('\n');
};

/**
 * Calculates rectal dosages
 * @param {number} weightInLbs Weight in lbs
 * @return {any} Something
 */
export async function generateRectalDosages(weightInLbs:number):Promise<any> {
  return [
    `**Threshold**: ${Math.round(weightInLbs * 0.3)}mg`,
    `**Light**: ${Math.round(weightInLbs * 0.6)}mg`,
    `**Common**: ${Math.round(weightInLbs * 0.75)}-${Math.round(weightInLbs * 2)}mg`,
    `**Strong**: ${Math.round(weightInLbs * 2)}-${Math.round(weightInLbs * 2.5)}mg`,
    `**K-hole**: ${Math.round(weightInLbs * 3)}-${Math.round(weightInLbs * 4)}mg`,
  ]
    .join('\n');
}
