import drugDataTripsit from '../../../assets/data/tripsitDB.json';

const F = f(__filename);

export type DxmDataType = {
  First: { min: number, max: number };
  Second: { min: number, max: number };
  Third: { min: number, max: number };
  Fourth: { min: number, max: number };
};

type ReturnType = {
  data: DxmDataType;
  units: string;
};

type KetaDosage = {
  insufflated: string,
  rectal: string,
};

type Dosage = {
  threshold: string;
  light: string;
  common: string;
  strong: string;
  kHole: string;
};

const dxmData:DxmDataType = {
  First: { min: 1.5, max: 2.5 },
  Second: { min: 2.5, max: 7.5 },
  Third: { min: 7.5, max: 15 },
  Fourth: { min: 15, max: 20 },
};

const data = {
  First: { min: 0, max: 0 },
  Second: { min: 0, max: 0 },
  Third: { min: 0, max: 0 },
  Fourth: { min: 0, max: 0 },
} as DxmDataType;

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

/**
 * @param {number} givenWeight
 * @param {string} weightUnits
 * @param {string} taking
 * @return {any}
 */
export async function calcDxm(givenWeight:number, weightUnits:string, taking:string):Promise<ReturnType> {
  let calcWeight = weightUnits === 'lbs' ? givenWeight * 0.453592 : givenWeight;
  let roaValue = 0;
  let units = '';
  if (taking === 'RoboCough (ml)') {
    roaValue = 10;
    units = '(ml)';
  } else if (taking === 'Robitussin DX (oz)') {
    roaValue = 88.5;
    units = '(oz)';
  } else if (taking === 'Robitussin DX (ml)') {
    roaValue = 3;
    units = '(ml)';
  } else if (taking === 'Robitussin Gelcaps (15 mg caps)') {
    roaValue = 15;
    units = '(15 mg caps)';
  } else if (taking === 'Pure (mg)') {
    roaValue = 1;
    units = '(mg)';
  } else if (taking === '30mg Gelcaps (30 mg caps)') {
    roaValue = 30;
    units = '(30 mg caps)';
  } else if (taking === 'RoboTablets (30 mg tablets)') {
    roaValue = 40.9322;
    units = '(30 mg tablets)';
  }

  // log.debug(F, `roaValue:  ${roaValue}`);
  // log.debug(F, `units: ${units}`);

  calcWeight /= roaValue;
  // log.debug(F, `calcWeight: ${calcWeight}`);

  Object.keys(dxmData).forEach(key => {
    const min = Math.round((dxmData[key as keyof DxmDataType].min * calcWeight) * 100) / 100;
    const max = Math.round((dxmData[key as keyof DxmDataType].max * calcWeight) * 100) / 100;
    data[key as keyof DxmDataType] = {
      min,
      max,
    };
  });

  // log.info(F, `response: ${JSON.stringify(data, null, 2)}`);
  return { data, units };
}

/**
 * Calculates insuffilated dosages
 * @param {number} weightInLbs Weight in lbs
 * @return {any} Something
 */
export async function generateInsufflatedDosages(weightInLbs:number):Promise<Dosage> {
  return {
    threshold: `${Math.round(weightInLbs * 0.1)}mg`,
    light: `${Math.round(weightInLbs * 0.15)}mg`,
    common: `${Math.round(weightInLbs * 0.3)}mg`,
    strong: `${Math.round(weightInLbs * 0.5)}mg-${Math.round(weightInLbs * 0.75)}mg`,
    kHole: `${Math.round(weightInLbs)}mg`,
  };
}

/**
 * Calculates rectal dosages
 * @param {number} weightInLbs Weight in lbs
 * @return {any} Something
 */
export async function generateRectalDosages(weightInLbs:number):Promise<Dosage> {
  return {
    threshold: `${Math.round(weightInLbs * 0.3)}mg`,
    light: `${Math.round(weightInLbs * 0.5)}mg`,
    common: `${Math.round(weightInLbs * 0.75)}mg-${Math.round(weightInLbs * 2)}mg`,
    strong: `${Math.round(weightInLbs * 2)}mg-${Math.round(weightInLbs * 2.5)}mg`,
    kHole: `${Math.round(weightInLbs * 3)}mg-${Math.round(weightInLbs * 4)}mg`,
  };
}

/**
 * Calculates ketamine dosages
 * @param {number} weight Weight in lbs
 * @param {'lbs' | 'kg'} unit
 * @return {ketaDosage}
 */
export async function calcKetamine(weight:number, unit:'lbs' | 'kg'):Promise<KetaDosage> {
  const calcWeight = unit === 'kg' ? weight * 2.20462 : weight;

  const noseDose = await generateInsufflatedDosages(calcWeight);
  let noseDoseString = '' as string;
  Object.keys(noseDose).forEach(key => {
    const title = key.charAt(0).toUpperCase() + key.slice(1);
    noseDoseString += `**${title}**: ${noseDose[key as keyof typeof noseDose]}\n`;
  });
  // log.debug(F, `noseDoseString: ${noseDoseString}`);

  const buttDose = await generateRectalDosages(calcWeight);
  let buttDoseString = '' as string;
  // for (const [key, value] of Object.entries(buttDose)) {
  Object.keys(buttDose).forEach(key => {
    const title = key.charAt(0).toUpperCase() + key.slice(1);
    buttDoseString += `**${title}**: ${buttDose[key as keyof typeof buttDose]}\n`;
  });
  // log.debug(F, `buttDoseString: ${buttDoseString}`);

  const kData = {
    insufflated: noseDoseString,
    rectal: buttDoseString,
  };

  log.info(F, `response: ${JSON.stringify(kData, null, 2)}`);
  return kData;
}

export async function calcMDMA(weight: number, unit: 'lbs' | 'kg'): Promise<{
  '🌱 First Time': string;
  '🔆 Light': string;
  '🌟 Common': string;
  '💪 Strong': string;
  '⚠️ Max': string;
}> {
  const weightInKgs = unit === 'lbs' ? weight * 0.453592 : weight;
  return {
    '🌱 First Time': `${Math.round(weightInKgs * 0.8)}mg (0.8mg/kg)`,
    '🔆 Light': `${Math.round(weightInKgs * 1.2)}mg (1.2mg/kg)`,
    '🌟 Common': `${Math.round(weightInKgs * 1.5)}mg (1.5mg/kg)`,
    '💪 Strong': `${Math.round(weightInKgs * 1.7)}mg (1.7mg/kg)`,
    '⚠️ Max': `${Math.round(weightInKgs * 2.0)}mg (2.0mg/kg)`,
  };
}

/**
 * Calculate how much of a solvent to use for a given amount of a substance to get the wanted
 * dose per push
 * @return {string}
 */
export async function calcSolvent(substance:number, mgpp:number, mlpp:number):Promise<number> {
  return Number(((substance / mgpp) * mlpp).toFixed(2));
}

/**
 *Calculate how much of a substance you need for a given amount of solvent to archieve the wanted dose per push
 */
export async function calcSubstance(solvent:number, mgpp:number, mlpp:number):Promise<number> {
  return Number(((solvent * mgpp) / mlpp).toFixed(2));
}

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
  // log.debug(F, `desiredDose: ${desiredDose}`);
  if (desiredDose) {
    estimatedDosage += (desiredDose - lastDose);
    // log.debug(F, `estimatedDosage: ${estimatedDosage} (desiredDose: ${desiredDose})`);
    newAmount = ((estimatedDosage < desiredDose) ? desiredDose : estimatedDosage);
    // log.debug(F, `newAmountA: ${newAmount} (desiredDose: ${desiredDose})`);
  } else {
    // log.debug(F, `estimatedDosage: ${estimatedDosage} (desiredDose: ${desiredDose})`);
    newAmount = ((estimatedDosage < lastDose) ? lastDose : estimatedDosage);
    // log.debug(F, `newAmountB: ${newAmount} (desiredDose: ${desiredDose})`);
  }

  const result = Math.round(newAmount * 10) / 10;

  log.info(F, `response: ${JSON.stringify(result, null, 2)}`);

  return result;
}
