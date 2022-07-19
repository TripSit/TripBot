'use strict';

const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

module.exports = {

  async calcBenzo(dosage, drugA, drugB) {
    logger.debug(`[${PREFIX}] dosage: ${dosage} | drug_a: ${drugA} | drug_b: ${drugB}`);

    const drugCache = await JSON.parse(fs.readFileSync(`${__dirname}/../assets/data/drug_db_tripsit.json`));
    // logger.debug(`[${PREFIX}] drugCache: ${drugCache.length}`);
    // console.log(drugCache);

    let benzoCache = {};
    benzoCache = _.filter((drugCache), bCache => _.has(bCache.properties, 'dose_to_diazepam'));

    _.each(benzoCache, benzo => {
      _.each(benzo.aliases, alias => {
        benzoCache.push({
          name: alias,
          pretty_name: alias.charAt(0).toUpperCase() + alias.slice(1),
          properties: benzo.properties,
          formatted_dose: benzo.formatted_dose,
        });
      });
    });

    benzoCache = _.sortBy(benzoCache, 'name');
    const regex = /[0-9]+\.?[0-9]?/;
    benzoCache = _.each(benzoCache, bCache => {
      const converted = regex.exec(bCache.properties.dose_to_diazepam);
      // logger.debug(`[${PREFIX}] converted: ${converted}`);
            bCache.diazvalue = converted; // eslint-disable-line
    });

    const drugNames = [];
        for (const eachDrug in benzoCache) { // eslint-disable-line
      drugNames.push({
        label: benzoCache[eachDrug].name,
        value: benzoCache[eachDrug].name,
      });
    }

    let doseA = 0;
    let doseB = 0;
    let drugAResult = {};
    let drugBResult = {};
        for (const eachBenzo of benzoCache) { // eslint-disable-line
      if (eachBenzo.name === drugA) {
        drugAResult = eachBenzo;
        doseA = eachBenzo.diazvalue;
        logger.debug(`[${PREFIX}] ${drugA} dose_a: ${doseA}`);
      }
      if (eachBenzo.name === drugB) {
        drugBResult = eachBenzo;
        doseB = eachBenzo.diazvalue;
        logger.debug(`[${PREFIX}] ${drugB} dose_b: ${doseB}`);
      }
    }

    const result = (dosage / doseA) * doseB;
    let drugADosageText = '';
    if (drugAResult.formatted_dose.Oral) {
            console.log(`[${PREFIX}] ${drugA} is Oral`); // eslint-disable-line
      drugADosageText = `\
            ${drugAResult.formatted_dose.Oral.Light ? `Light: ${drugAResult.formatted_dose.Oral.Light}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Low ? `Low: ${drugAResult.formatted_dose.Oral.Low}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Common ? `Common: ${drugAResult.formatted_dose.Oral.Common}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Heavy ? `Heavy: ${drugAResult.formatted_dose.Oral.Heavy}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Strong ? `Strong: ${drugAResult.formatted_dose.Oral.Strong}\n` : ''}`;
    } else if (drugAResult.formatted_dose.Light) {
            console.log(`[${PREFIX}] ${drugA} is Light`); // eslint-disable-line
      drugADosageText = `\
            ${drugAResult.formatted_dose.Light.Light ? `Light: ${drugAResult.formatted_dose.Light.Light}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Low ? `Low: ${drugAResult.formatted_dose.Light.Low}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Common ? `Common: ${drugAResult.formatted_dose.Light.Common}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Heavy ? `Heavy: ${drugAResult.formatted_dose.Light.Heavy}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Strong ? `Strong: ${drugAResult.formatted_dose.Light.Strong}\n` : ''}`;
    }

    let drugBDosageText = '';
    if (drugBResult.formatted_dose.Oral) {
            console.log(`[${PREFIX}] ${drugA} is Oral`); // eslint-disable-line
      drugBDosageText = `\
            ${drugBResult.formatted_dose.Oral.Light ? `Light: ${drugBResult.formatted_dose.Oral.Light}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Low ? `Low: ${drugBResult.formatted_dose.Oral.Low}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Common ? `Common: ${drugBResult.formatted_dose.Oral.Common}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Heavy ? `Heavy: ${drugBResult.formatted_dose.Oral.Heavy}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Strong ? `Strong: ${drugBResult.formatted_dose.Oral.Strong}\n` : ''}`;
    } else if (drugBResult.formatted_dose.Light) {
            console.log(`[${PREFIX}] ${drugA} is Light`); // eslint-disable-line
      drugBDosageText = `\
            ${drugBResult.formatted_dose.Light.Light ? `Light: ${drugBResult.formatted_dose.Light.Light}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Low ? `Low: ${drugBResult.formatted_dose.Light.Low}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Common ? `Common: ${drugBResult.formatted_dose.Light.Common}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Heavy ? `Heavy: ${drugBResult.formatted_dose.Light.Heavy}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Strong ? `Strong: ${drugBResult.formatted_dose.Light.Strong}\n` : ''}`;
    }

    // console.log(drugAResult);
    return { result, drugAResult, drugBResult };
  },

};
