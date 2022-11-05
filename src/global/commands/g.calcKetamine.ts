import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Calculates ketamine dosages
 * @param {number} weight Weight in lbs
 * @param {'lbs' | 'kg'} unit
 * @return {ketaDosage}
 */
export async function calcKetamine(weight:number, unit:'lbs' | 'kg'):Promise<ketaDosage> {
  const calcWeight = unit === 'kg' ? weight * 2.20462 : weight;

  const noseDose = await generateInsufflatedDosages(calcWeight);
  let noseDoseString = '' as string;
  for (const [key, value] of Object.entries(noseDose)) {
    // Capitalize the key
    const title = key.charAt(0).toUpperCase() + key.slice(1);
    noseDoseString += `**${title}**: ${value}\n`;
  }
  // log.debug(`[${PREFIX}] noseDoseString: ${noseDoseString}`);

  const buttDose = await generateInsufflatedDosages(calcWeight);
  let buttDoseString = '' as string;
  for (const [key, value] of Object.entries(buttDose)) {
    // Capitalize the key
    const title = key.charAt(0).toUpperCase() + key.slice(1);
    buttDoseString += `**${title}**: ${value}\n`;
  }
  // log.debug(`[${PREFIX}] buttDoseString: ${buttDoseString}`);

  const data = {
    insufflated: noseDoseString,
    rectal: buttDoseString,
  };

  log.info(`[${PREFIX}] response: ${JSON.stringify(data, null, 2)}`);
  return data;
};

/**
 * Calculates insuffilated dosages
 * @param {number} weightInLbs Weight in lbs
 * @return {any} Something
 */
export async function generateInsufflatedDosages(weightInLbs:number):Promise<dosage> {
  return {
    threshold: `${Math.round(weightInLbs * 0.1)}mg`,
    light: `${Math.round(weightInLbs * 0.15)}mg`,
    common: `${Math.round(weightInLbs * 0.3)}mg`,
    strong: `${Math.round(weightInLbs * .5)}mg-${Math.round(weightInLbs * .75)}mg`,
    kHole: `${Math.round(weightInLbs)}mg`,
  };
};

/**
 * Calculates rectal dosages
 * @param {number} weightInLbs Weight in lbs
 * @return {any} Something
 */
export async function generateRectalDosages(weightInLbs:number):Promise<dosage> {
  return {
    threshold: `${Math.round(weightInLbs * 0.3)}mg`,
    light: `${Math.round(weightInLbs * 0.5)}mg`,
    common: `${Math.round(weightInLbs * 0.75)}mg-${Math.round(weightInLbs * 2)}mg`,
    strong: `${Math.round(weightInLbs * 2)}mg-${Math.round(weightInLbs * 2.5)}mg`,
    kHole: `${Math.round(weightInLbs * 3)}mg-${Math.round(weightInLbs * 4)}mg`,
  };
}

type ketaDosage = {
  insufflated: string,
  rectal: string,
}

type dosage = {
  threshold: string;
  light: string;
  common: string;
  strong: string;
  kHole: string;
}

