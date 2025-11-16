import {
  AutocompleteInteraction,
} from 'discord.js';
import Fuse from 'fuse.js';
import { ai_model } from '@prisma/client';
import { Drug } from 'tripsit_drug_db';
import pillColors from '../../../assets/data/pill_colors.json';
import pillShapes from '../../../assets/data/pill_shapes.json';
import cbData from '../../../assets/data/combinedDB.json';
import tsData from '../../../assets/data/tripsitDB.json';
import timezones from '../../../assets/data/timezones.json';
import unitsOfMeasurement from '../../../assets/data/units_of_measurement.json';
import { CbSubstance } from '../../global/@types/combined';

const drugDataTripsit = tsData as {
  [key: string]: Drug;
};

const drugDataAll = cbData as CbSubstance[];

const F = f(__filename); // eslint-disable-line

const timezoneNames: string[] = [];
for (const timezone of timezones) { // eslint-disable-line
  timezoneNames.push(timezone.label);
}

const measurementNames: string[] = [];
for (const unit of unitsOfMeasurement) { // eslint-disable-line
  measurementNames.push(unit.abbr);
}

const pillColorNames: string[] = [];
for (const color of pillColors) { // eslint-disable-line
  pillColorNames.push(Object.keys(color)[0]);
}
const defaultPillColors = pillColorNames.slice(0, 25);
// log.debug(F, `pill_color_names: ${pill_color_names}`);

const pillShapeNames: string[] = [];
for (const shape of pillShapes) { // eslint-disable-line
  pillShapeNames.push(Object.keys(shape)[0]);
}
const defaultShapes = pillShapeNames.slice(0, 25);
// log.debug(F, `pill_shape_names: ${pill_shape_names}`);

// Get a list of drug names and aliases from drugDataAll
const drugNames = drugDataAll.map(drug => ({
  name: drug.name.slice(0, 1).toUpperCase() + drug.name.slice(1),
  aliases: drug.aliases?.map(alias => alias.slice(0, 1).toUpperCase() + alias.slice(1)),
}));

async function autocompletePills(interaction: AutocompleteInteraction) {
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
      interaction.respond(defaultPillColors.map(choice => ({ name: choice, value: choice })));
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
}

async function autocompleteBenzos(interaction: AutocompleteInteraction) {
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
    // log.error(F, 'drugDataAll is null or undefined');
    return;
  }

  const tsDrugNames = Object.keys(drugDataTripsit);
  const benzoNames = tsDrugNames.filter(drugName => {
    const props = drugDataTripsit[drugName as keyof typeof drugDataTripsit].properties;
    return Object.hasOwn(props, 'dose_to_diazepam');
  });

  // log.debug(F, `benzoNames: ${benzoNames}`);

  const benzoCache = benzoNames.map(drugName => {
    const drugObj = {
      name: drugName,
      aliases: [] as string[],
    };
    if (Object.hasOwn(drugDataTripsit[drugName as keyof typeof drugDataTripsit], 'aliases')) {
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
}

async function autocompleteTimezone(interaction: AutocompleteInteraction) {
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
}

async function autocompleteConvert(interaction: AutocompleteInteraction) {
  let firstUnit: string = '';
  let focusedOption = false;
  if (interaction.options.data[1] !== undefined) {
    firstUnit = interaction.options.data[1].value as string;
    focusedOption = interaction.options.data[1].focused as boolean;
  }

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
}

async function autocompleteDrugNames(interaction: AutocompleteInteraction) {
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
  const fuse = new Fuse(drugNames, options);
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

async function autocompleteAiModels(interaction: AutocompleteInteraction) {
  const options = {
    shouldSort: true,
    keys: [
      'name',
    ],
  };
  const modelList = Object.keys(ai_model).map(model => ({ name: model }));

  const fuse = new Fuse(modelList, options);
  const focusedValue = interaction.options.getFocused();
  // log.debug(F, `focusedValue: ${focusedValue}`);
  const results = fuse.search(focusedValue);
  // log.debug(F, `Autocomplete results: ${results}`);
  if (results.length > 0) {
    const top25 = results.slice(0, 20);
    const listResults = top25.map(choice => ({
      name: choice.item.name,
      value: choice.item.name,
    }));
    // log.debug(F, `list_results: ${listResults}`);
    interaction.respond(listResults);
  } else {
    const defaultDiscordColors = modelList.slice(0, 25);
    const listResults = defaultDiscordColors.map(choice => ({ name: choice.name, value: choice.name }));
    // log.debug(F, `list_results: ${listResults}`);
    interaction.respond(listResults);
  }
}

async function autocompleteAiNames(interaction: AutocompleteInteraction) {
  const options = {
    shouldSort: true,
    keys: [
      'name',
    ],
  };

  const nameList = interaction.guild?.id === env.DISCORD_GUILD_ID
    ? await db.ai_personas.findMany({
      select: {
        name: true,
      },
    })
    : [{
      name: 'tripbot',
    }];

  const fuse = new Fuse(nameList, options);
  const focusedValue = interaction.options.getFocused();
  // log.debug(F, `focusedValue: ${focusedValue}`);
  const results = fuse.search(focusedValue);
  // log.debug(F, `Autocomplete results: ${results}`);
  if (results.length > 0) {
    const top25 = results.slice(0, 20);
    const listResults = top25.map(choice => ({
      name: (choice.item as any).name,
      value: (choice.item as any).name,
    }));
    // log.debug(F, `list_results: ${listResults}`);
    interaction.respond(listResults);
  } else {
    const defaultDiscordColors = nameList.slice(0, 25) as {
      name: string;
    }[];
    const listResults = defaultDiscordColors.map(choice => ({ name: choice.name, value: choice.name }));
    // log.debug(F, `list_results: ${listResults}`);
    interaction.respond(listResults);
  }
}

async function autocompleteQuotes(interaction: AutocompleteInteraction) {
  const options = {
    shouldSort: true,
    keys: [
      'quote',
    ],
  };

  let whereClause = {};

  // If the user option is filled in, find the user's ID and use that to filter the quotes
  const user = interaction.options.get('user');
  if (user) {
    // log.debug(F, `User option: ${user.value}`);
    const userValue = user.value as string;
    const userData = await db.users.upsert({
      where: { discord_id: userValue },
      create: { discord_id: userValue },
      update: {},
    });
    whereClause = {
      user_id: userData.id,
    };
  }

  // log.debug(F, `whereClause: ${JSON.stringify(whereClause, null, 2)}`);
  const quoteList = await db.quotes.findMany({
    select: {
      quote: true,
      user_id: true,
      url: true,
      date: true,
    },
    where: whereClause,
  });

  // log.debug(F, `quoteList: ${quoteList.length}`);

  const fuse = new Fuse(quoteList, options);
  const focusedValue = interaction.options.getFocused();
  // log.debug(F, `focusedValue: ${focusedValue}`);
  const results = fuse.search(focusedValue);
  // log.debug(F, `Autocomplete results: ${results.length}`);
  // log.debug(F, `Autocomplete results: ${JSON.stringify(results, null, 2)}`);
  if (results.length > 0) {
    const top25 = results.slice(0, 20);
    const listResults = top25.map(choice => ({
      name: (choice.item as any).quote.slice(0, 99),
      value: (choice.item as any).quote.slice(0, 99),
    }));
    // log.debug(F, `list_results: ${listResults}`);
    await interaction.respond(listResults);
  } else if (focusedValue !== '') {
    await interaction.respond([
      { name: 'No results found', value: 'No results found' },
    ]);
  } else {
    const initialQuotes = quoteList.slice(0, 25) as {
      quote: string;
    }[];
    const listResults = initialQuotes.map(choice => ({
      name: choice.quote.slice(0, 99),
      value: choice.quote.slice(0, 99),
    }));
    // log.debug(F, `list_results: ${listResults}`);
    // log.debug(F, `Returing ${listResults.length} quotes`);
    await interaction.respond(listResults);
  }
}

export default autocomplete;
/**
 * Handles autocomplete information
 * @param {AutocompleteInteraction} interaction
 * @param {Client} discordClient
 * @return {Promise<void>}
 */

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  // log.debug(F, `Autocomplete requested for: ${interaction.commandName}`);
  if (interaction.commandName === 'pill-id') {
    await autocompletePills(interaction);
  } else if (interaction.commandName === 'calc' && interaction.options.getSubcommand() === 'benzo') {
    await autocompleteBenzos(interaction);
  } else if (interaction.commandName === 'timezone') {
    await autocompleteTimezone(interaction);
  } else if (interaction.commandName === 'convert') {
    autocompleteConvert(interaction);
  } else if (interaction.commandName === 'ai' || interaction.commandName === 'ai_manage') {
    const focusedOption = interaction.options.getFocused(true).name;
    if (focusedOption === 'model') {
      autocompleteAiModels(interaction);
    }
    if (focusedOption === 'name') {
      autocompleteAiNames(interaction);
    }
  } else if (interaction.commandName === 'quote') {
    await autocompleteQuotes(interaction);
  } else { // If you don't need a specific autocomplete, return a list of drug names
    await autocompleteDrugNames(interaction);
  }
}
