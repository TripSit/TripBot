/* eslint-disable no-unused-vars */

import {stripIndents} from 'common-tags';
import env from '../utils/env.config';
import logger from '../utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

type DxmDataType = {
  First: {min: number, max: number};
  Second: {min: number, max: number};
  Third: {min: number, max: number};
  Fourth: {min: number, max: number};
};

/**
 * @param {number} givenWeight
 * @param {string} weightUnits
 * @param {string} taking
 * @return {any}
 */
export async function calcDxm(givenWeight:number, weightUnits:string, taking:string):Promise<any> {
  logger.debug(`${PREFIX} started!`);
  let calcWeight = weightUnits === 'lbs' ? givenWeight * 0.453592 : givenWeight;
  // logger.debug(`[${PREFIX}] calc_weight: ${calcWeight}`);

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

  // logger.debug(`[${PREFIX}] roaValue:  ${roaValue}`);
  // logger.debug(`[${PREFIX}] units: ${units}`);

  calcWeight /= roaValue;
  // logger.debug(`[${PREFIX}] calcWeight: ${calcWeight}`);


  const dxmData:DxmDataType = {
    First: {min: 1.5, max: 2.5},
    Second: {min: 2.5, max: 7.5},
    Third: {min: 7.5, max: 15},
    Fourth: {min: 15, max: 20},
  };

  const returnData = {
    First: {min: 0, max: 0},
    Second: {min: 0, max: 0},
    Third: {min: 0, max: 0},
    Fourth: {min: 0, max: 0},
  } as DxmDataType;

  Object.keys(dxmData).forEach((key) => {
    const min = Math.round((dxmData[key as keyof DxmDataType].min * calcWeight) * 100) / 100;
    const max = Math.round((dxmData[key as keyof DxmDataType].max * calcWeight) * 100) / 100;
    returnData[key as keyof DxmDataType] = {
      min: min,
      max: max,
    };
  });

  logger.debug(`${PREFIX} finished!`);
  return [returnData, units];
};
