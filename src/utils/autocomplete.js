'use strict';

const path = require('path');
const Fuse = require('fuse.js');
const _ = require('underscore'); // TODO: underscore.js
const logger = require('./logger');
const pillColors = require('../assets/pill_colors.json');
const pillShapes = require('../assets/pill_shapes.json');
const drugDataAll = require('../assets/drug_db_combined.json');
const drugDataTripsit = require('../assets/drug_db_tripsit.json');
const timezones = require('../assets/timezones.json');

const PREFIX = path.parse(__filename).name;

const timezoneNames = [];
for (let i = 0; i < timezones.length; i += 1) {
  timezoneNames.push(timezones[i].label);
}
const drugNames = drugDataAll.map(d => d.name);

const pillColorNames = [];
for (let i = 0; i < pillColors.length; i += 1) {
  pillColorNames.push(Object.keys(pillColors[i])[0]);
}
const defaultColors = pillColorNames.slice(0, 25);
// logger.debug(`[${PREFIX}] pill_color_names: ${pill_color_names}`);

const pillShapeNames = [];
for (let i = 0; i < pillShapes.length; i += 1) {
  pillShapeNames.push(Object.keys(pillShapes[i])[0]);
}
const defaultShapes = pillShapeNames.slice(0, 25);
// logger.debug(`[${PREFIX}] pill_shape_names: ${pill_shape_names}`);

// The following code came from the benzo_convert tool in the github
const drugCache = drugDataTripsit;
// Filter any drug not containing the dose_to_diazepam property
let benzoCache = _.filter((drugCache), dCache => _.has(dCache.properties, 'dose_to_diazepam'));

_.each(benzoCache, benzo => {
  _.each(benzo.aliases, alias => {
    benzoCache.push({
      // Add used aliases to new objects
      name: alias,
      pretty_name: alias.charAt(0).toUpperCase() + alias.slice(1),
      properties: benzo.properties,
      formatted_dose: benzo.formatted_dose,
    });
  });
});

benzoCache = _.sortBy(benzoCache, 'name');
const regex = /\d+\.?\d?/;
benzoCache = _.each(benzoCache, bCache => {
  bCache.diazvalue = regex.exec(bCache.properties.dose_to_diazepam); // eslint-disable-line
});
// End borrowed code, thanks bjorn!

const benzoDrugNames = benzoCache.map(d => d.name);
const defaultBenzoNames = benzoDrugNames.slice(0, 25);

module.exports = {
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Autocomplete requested for: ${interaction.commandName}`);
    // if (interaction.commandName === 'ems') {
    //   const emsData = Object.keys(emergency).map(key => ({
    //   country: key, data: emergency[key]
    // }));
    //   // logger.debug(`[${PREFIX}] emsData: ${JSON.stringify(emsData, null, 2)}`);
    //   const options = {
    //     shouldSort: true,
    //     keys: [
    //       'country',
    //     ],
    //   };
    //   const fuse = new Fuse(emsData, options);
    //   // logger.debug(`[${PREFIX}] fuse: ${JSON.stringify(fuse, null, 2)}`);
    //   const focusedValue = interaction.options.getFocused();
    //   logger.debug(`[${PREFIX}] focusedValue: ${focusedValue}`);
    //   const results = fuse.search(focusedValue);
    //   // logger.debug(`[${PREFIX}] Autocomplete results: ${results}`);
    //   if (results.length > 0) {
    //     const top25 = results.slice(0, 25);
    //     const listResults = top25.map(choice => ({
    //       name: choice.item.country,
    //       value: choice.item.country,
    //     }));
    //     // logger.debug(`[${PREFIX}] list_results1: ${listResults}`);
    //     interaction.respond(listResults);
    //   } else {
    //     const defaultEms = Object.keys(emergency).slice(0, 25);
    //     const listResults = defaultEms.map(choice => ({ name: choice, value: choice }));
    //     // logger.debug(`[${PREFIX}] list_results2: ${listResults}`);
    //     interaction.respond(listResults);
    //   }
    // } else
    if (interaction.commandName === 'pill-id') {
      const focusedOption = interaction.options.getFocused(true).name;
      const options = {
        shouldSort: true,
        keys: [
          'name',
        ],
      };

      if (focusedOption === 'color') {
        const fuse = new Fuse(pillColorNames, options);
        const focusedValue = interaction.options.getFocused();
        const results = fuse.search(focusedValue);
        if (results.length > 0) {
          const top25 = results.slice(0, 25);
          const listResults = top25.map(choice => ({ name: choice.item, value: choice.item }));
          interaction.respond(listResults);
        } else {
          interaction.respond(defaultColors.map(choice => ({ name: choice, value: choice })));
        }
      }
      if (focusedOption === 'shape') {
        const fuse = new Fuse(pillShapeNames, options);
        const focusedValue = interaction.options.getFocused();
        const results = fuse.search(focusedValue);
        if (results.length > 0) {
          const top25 = results.slice(0, 25);
          const listResults = top25.map(choice => ({ name: choice.item, value: choice.item }));
          interaction.respond(listResults);
        } else {
          interaction.respond(defaultShapes.map(choice => ({ name: choice, value: choice })));
        }
      }
    } else if (interaction.commandName === 'calc-benzo') {
      const options = {
        shouldSort: true,
        keys: [
          'name',
          'aliasesStr',
        ],
      };
      // eslint-disable-next-line
      // logger.debug(`[${PREFIX}] benzo_drug_names: ${JSON.stringify(benzo_drug_names, null, 2)}`);
      const fuse = new Fuse(benzoDrugNames, options);
      const focusedValue = interaction.options.getFocused();
      logger.debug(`[${PREFIX}] focusedValue: ${focusedValue}`);
      const results = fuse.search(focusedValue);
      logger.debug(`[${PREFIX}] results: ${JSON.stringify(results, null, 2)}`);
      if (results.length > 0) {
        const top25 = results.slice(0, 25);
        interaction.respond(top25.map(choice => ({ name: choice.item, value: choice.item })));
      } else {
        interaction.respond(defaultBenzoNames.map(choice => ({ name: choice, value: choice })));
      }
    } else if (interaction.commandName === 'time') {
      const options = {
        shouldSort: true,
        keys: [
          'label',
        ],
      };

      const fuse = new Fuse(timezones, options);
      const focusedValue = interaction.options.getFocused();
      // logger.debug(`[${PREFIX}] focusedValue: ${focusedValue}`);
      const results = fuse.search(focusedValue);
      // logger.debug(`[${PREFIX}] Autocomplete results: ${results}`);
      if (results.length > 0) {
        const top25 = results.slice(0, 25);
        const listResults = top25.map(choice => ({
          name: choice.item.label,
          value: choice.item.label,
        }));
        // logger.debug(`[${PREFIX}] list_results: ${listResults}`);
        interaction.respond(listResults);
      } else {
        const defaultTimezones = timezoneNames.slice(0, 25);
        const listResults = defaultTimezones.map(choice => ({ name: choice, value: choice }));
        // logger.debug(`[${PREFIX}] list_results: ${listResults}`);
        interaction.respond(listResults);
      }
    } else { // If you don't need a specific autocomplete, return a list of drug names
      const options = {
        shouldSort: true,
        keys: [
          'name',
          'aliasesStr',
        ],
      };

      // For each dictionary in the drug_data_all list, find the "name" key and add it to a list
      const fuse = new Fuse(drugNames, options);
      const focusedValue = interaction.options.getFocused();
      const results = fuse.search(focusedValue);
      let top25 = [];
      if (results.length > 0) {
        top25 = results.slice(0, 25);
        interaction.respond(top25.map(choice => ({ name: choice.item, value: choice.item })));
      } else {
        const TOP_PSYCHS = ['Cannabis', 'MDMA', 'LSD', 'DMT', 'Mushrooms'];
        const TOP_DISSOS = ['Zolpidem', 'Ketamine', 'DXM', 'PCP', 'Salvia'];
        const TOP_OPIATE = ['Alcohol', 'Hydrocodone', 'Oxycodone', 'Tramadol', 'Heroin'];
        const TOP_BENZOS = ['Alprazolam', 'Clonazepam', 'Diazepam', 'Lorazepam', 'Flunitrazepam'];
        const TOP_SPEEDS = ['Nicotine', 'Amphetamine', 'Cocaine', 'Methamphetamine', 'Methylphenidate'];
        const TOP_DRUGS = TOP_PSYCHS.concat(TOP_DISSOS, TOP_OPIATE, TOP_BENZOS, TOP_SPEEDS);
        interaction.respond(TOP_DRUGS.map(choice => ({ name: choice, value: choice })));
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
