'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const drugDataAll = require('../assets/data/drug_db_combined.json');
const comboDefs = require('../assets/data/combo_definitions.json');

module.exports = {
  combo: async (drugA, drugB) => {
    logger.debug(`[${PREFIX}] started!`);
    logger.debug(`[${PREFIX}] drug_a: ${drugA} | drug_b: ${drugB}`);
    for (let i = 0; i < Object.keys(drugDataAll).length; i += 1) {
      if (drugDataAll[i]) {
        logger.debug(`[${PREFIX}] drugDataAll[i].name: ${drugDataAll[i].name}`);
        if (
          drugDataAll[i].name.toLowerCase() === drugA.toLowerCase()
          || drugDataAll[i].aliases.map(element => element.toLowerCase())
            .includes(drugA.toLowerCase())) {
          logger.debug(`[${PREFIX}] Found drug_a: ${drugA}`);
          if (drugDataAll[i].interactions) {
            logger.debug(`[${PREFIX}] drug_a has interactions`);
            let result = '';
            for (let j = 0; j < drugDataAll[i].interactions.length; j += 1) {
              if (drugDataAll[i].interactions[j].name.toLowerCase() === drugB.toLowerCase()
              || drugDataAll[i].aliases.map(element => element.toLowerCase())
                .includes(drugB.toLowerCase())) {
                logger.debug(`[${PREFIX}] Found drug_b: ${drugB}`);
                result = drugDataAll[i].interactions[j].status;
                // Loop through combo_defs and find the object where "status" is equal to result
                for (let k = 0; k < comboDefs.length; k += 1) {
                  if (comboDefs[k].status === result) {
                    logger.debug(`[${PREFIX}] Found combo_defs: ${comboDefs[k].status}`);
                    const { definition } = comboDefs[k];
                    const { emoji } = comboDefs[k];
                    const { color } = comboDefs[k];
                    const { thumbnail } = comboDefs[k];
                    const output = `${emoji} ${result} ${emoji}`;
                    return [output, definition, color, thumbnail];
                  }
                }
              }
            }
            if (result === '') {
              return null;
            }
          } else {
            return null;
          }
        }
      }
    }
  },
};
