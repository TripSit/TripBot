import {
  AutocompleteInteraction,
} from 'discord.js';
import Fuse from 'fuse.js';

import pillColors from '../../global/assets/data/pill_colors.json';
import pillShapes from '../../global/assets/data/pill_shapes.json';
import drugDataAll from '../../global/assets/data/drug_db_combined.json';
import drugDataTripsit from '../../global/assets/data/drug_db_tripsit.json';
import timezones from '../../global/assets/data/timezones.json';
import unitsOfMeasurement from '../../global/assets/data/units_of_measurement.json';

const F = f(__filename);

const timezoneNames:string[] = [];
for (let i = 0; i < timezones.length; i += 1) {
  timezoneNames.push(timezones[i].label);
}

const measurementNames:string[] = [];
for (let i = 0; i < unitsOfMeasurement.length; i += 1) {
  measurementNames.push(unitsOfMeasurement[i].abbr);
}

const pillColorNames:string[] = [];
for (let i = 0; i < pillColors.length; i += 1) {
  pillColorNames.push(Object.keys(pillColors[i])[0]);
}
const defaultColors = pillColorNames.slice(0, 25);
// log.debug(F, `pill_color_names: ${pill_color_names}`);

const pillShapeNames:string[] = [];
for (let i = 0; i < pillShapes.length; i += 1) {
  pillShapeNames.push(Object.keys(pillShapes[i])[0]);
}
const defaultShapes = pillShapeNames.slice(0, 25);
// log.debug(F, `pill_shape_names: ${pill_shape_names}`);

export default autocomplete;
/**
 * Handles autocomplete information
 * @param {AutocompleteInteraction} interaction
 * @param {Client} client
 * @return {Promise<void>}
 */
export async function autocomplete(interaction:AutocompleteInteraction):Promise<void> {
  // log.debug(F, `Autocomplete requested for: ${interaction.commandName}`);
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
  } else if (interaction.commandName === 'calc_benzo') {
    // log.debug(F, `Autocomplete requested for: ${interaction.commandName}`);
    const options = {
      shouldSort: true,
      threshold: 0.2,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        'name',
        'aliases',
      ],
    };

    if (drugDataTripsit === null || drugDataTripsit === undefined) {
      log.error(F, 'drugDataAll is null or undefined');
      return;
    }

    const drugNames = Object.keys(drugDataTripsit);
    const benzoNames = drugNames.filter(drugName => {
      const props = drugDataTripsit[drugName as keyof typeof drugDataTripsit].properties;
      return Object.prototype.hasOwnProperty.call(props, 'dose_to_diazepam');
    });

    // log.debug(F, `benzoNames: ${benzoNames}`);

    const benzoCache = benzoNames.map(drugName => {
      const drugObj = {
        name: drugName,
        aliases: [] as string[],
      };
      if (Object.prototype.hasOwnProperty.call(drugDataTripsit[drugName as keyof typeof drugDataTripsit], 'aliases')) {
        // @ts-ignore
        drugObj.aliases = drugDataTripsit[drugName as keyof typeof drugDataTripsit].aliases;
      }
      return drugObj;
    });

    // log.debug(F, `benzoCache: ${JSON.stringify(benzoCache, null, 2)}`);

    const fuse = new Fuse(benzoCache, options);
    const focusedValue = interaction.options.getFocused();
    // log.debug(F, `focusedValue: ${focusedValue}`);
    const results = fuse.search(focusedValue);
    // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);
    if (results.length > 0) {
      const top25 = results.slice(0, 25);
      interaction.respond(top25.map(choice => ({ name: choice.item.name, value: choice.item.name })));
    } else {
      const defaultBenzoNames = benzoNames.slice(0, 25);
      interaction.respond(defaultBenzoNames.map(choice => ({ name: choice, value: choice })));
    }
  } else if (interaction.commandName === 'timezone') {
    const options = {
      shouldSort: true,
      keys: [
        'label',
      ],
    };

    const fuse = new Fuse(timezones, options);
    const focusedValue = interaction.options.getFocused();
    // log.debug(F, `focusedValue: ${focusedValue}`);
    const results = fuse.search(focusedValue);
    // log.debug(F, `Autocomplete results: ${results}`);
    if (results.length > 0) {
      const top25 = results.slice(0, 25);
      const listResults = top25.map(choice => ({
        name: choice.item.label,
        value: choice.item.label,
      }));
        // log.debug(F, `list_results: ${listResults}`);
      interaction.respond(listResults);
    } else {
      const defaultTimezones = timezoneNames.slice(0, 25);
      const listResults = defaultTimezones.map(choice => ({ name: choice, value: choice }));
      // log.debug(F, `list_results: ${listResults}`);
      interaction.respond(listResults);
    }
  } else if (interaction.commandName === 'convert') {
    const firstUnit = interaction.options.data[1].value;
    const focusedOption = interaction.options.data[1].focused;

    let displayUnits = [];
    let measure = '';
    if (firstUnit !== '' && !focusedOption) {
      // log.debug(F, `firstUnit: ${firstUnit}`);
      // eslint-disable-next-line
        for (const i in unitsOfMeasurement) {
        if (unitsOfMeasurement[i].abbr.toLowerCase() === (firstUnit as string).toLowerCase()) {
          measure = unitsOfMeasurement[i].measure;
          // log.debug(F, `First unit measure: ${measure}`);
        }
      }
      // eslint-disable-next-line
        for (const i in unitsOfMeasurement) {
        if (unitsOfMeasurement[i].measure.toLowerCase() === measure.toLowerCase()) {
          displayUnits.push(unitsOfMeasurement[i]);
          // log.debug(F, `Added: ${unitsOfMeasurement[i].plural}`);
        }
      }
    } else {
      displayUnits = unitsOfMeasurement;
    }

    const options = {
      shouldSort: true,
      keys: [
        'plural',
        'singular',
        'abbr',
      ],
    };

    const fuse = new Fuse(displayUnits, options);
    const focusedValue = interaction.options.getFocused();
    // log.debug(F, `focusedValue: ${focusedValue}`);
    const results = fuse.search(focusedValue);
    // log.debug(F, `Autocomplete results: ${results}`);
    if (results.length > 0) {
      const top25 = results.slice(0, 25);
      const listResults = top25.map(choice => ({
        name: choice.item.abbr,
        value: choice.item.abbr,
      }));
        // log.debug(F, `list_results: ${listResults}`);
      interaction.respond(listResults);
    } else if (measure !== '') {
      const top25 = displayUnits.slice(0, 25);
      const listResults = top25.map(choice => ({
        name: choice.abbr,
        value: choice.abbr,
      }));
      // log.debug(F, `list_results: ${listResults}`);
      interaction.respond(listResults);
    } else {
      const defaultMeasurements = measurementNames.slice(0, 25);
      const listResults = defaultMeasurements.map(choice => ({ name: choice, value: choice }));
      // log.debug(F, `list_results: ${listResults}`);
      interaction.respond(listResults);
    }
  } else { // If you don't need a specific autocomplete, return a list of drug names
    const options = {
      shouldSort: true,
      threshold: 0.2,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        'name',
        'aliases',
      ],
    };
    const fuse = new Fuse(drugDataAll, options);
    const focusedValue = interaction.options.getFocused();
    const results = fuse.search(focusedValue);
    let top25 = [];
    if (results.length > 0) {
      top25 = results.slice(0, 25);
      interaction.respond(top25.map(choice => (
        { name: choice.item.name, value: choice.item.name })));
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
}
