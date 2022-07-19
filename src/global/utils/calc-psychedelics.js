'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');

module.exports = {

  async calc(lastDose, desiredDose, days) {
    let estimatedDosage = (lastDose / 100) * 280.059565 * (days ** -0.412565956);
    let newAmount = 0;
    if (desiredDose) {
      estimatedDosage += (desiredDose - lastDose);
      newAmount = ((estimatedDosage < desiredDose) ? desiredDose : estimatedDosage);
    } else {
      newAmount = ((estimatedDosage < lastDose) ? lastDose : estimatedDosage);
    }

    logger.debug(`[${PREFIX}] finished!`);

    return Math.round(newAmount * 10) / 10;
  },

};
