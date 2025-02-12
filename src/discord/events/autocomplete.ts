import {
  AutocompleteInteraction,
  GuildMember,
} from 'discord.js';
import Fuse from 'fuse.js';
import { DateTime } from 'luxon';
import { ai_model } from '@prisma/client';
import { Drug } from 'tripsit_drug_db';
import pillColors from '../../../assets/data/pill_colors.json';
import pillShapes from '../../../assets/data/pill_shapes.json';
import cbData from '../../../assets/data/combinedDB.json';
import tsData from '../../../assets/data/tripsitDB.json';
import timezones from '../../../assets/data/timezones.json';
import unitsOfMeasurement from '../../../assets/data/units_of_measurement.json';
import { CbSubstance } from '../../global/@types/combined';
import { Wordle, Connections, TheMini } from '../utils/nytUtils';

const drugDataTripsit = tsData as {
  [key: string]: Drug;
};

const drugDataAll = cbData as CbSubstance[];

const dateFormat = 'EEEE, MMMM dd, yyyy';

const F = f(__filename); // eslint-disable-line

type RoleDef = { name: string; value: string };

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

// TODO: Finish autocompleteNYT or remove it
async function autocompleteNYT(interaction: AutocompleteInteraction) {
  const game = interaction.options.getString('game');
  const focusedOption = interaction.options.getFocused(true).name;

  const formats = [
    'MM/dd/yyyy', // 01/01/2022
    'dd/MM/yyyy', // 01/01/2022
    'yyyy-MM-dd', // 2022-01-01
    'M/d/yyyy', // 1/1/2022
    'dd-MM-yyyy', // 01-01-2022
    'yyyy/MM/dd', // 2022/01/01
    'MMMM d, yyyy', // January 1, 2022
    'd MMMM yyyy', // 1 January 2022
    'd MMM, yyyy', // 1 Jan, 2022
    'MMMM do, yyyy', // January 1st, 2022
    'MMM d, yyyy', // Jan 1, 2022
    'MMM dd, yyyy', // Jan 01, 2022
    'MMMM dd, yyyy', // January 01, 2022
    'dd MMM yyyy', // 01 Jan 2022
    'dd MMMM', // 01 January
    'dd MMM', // 01 Jan
    'MMMM dd', // January 01
    'MMM dd', // Jan 01
    'do MMMM yyyy', // 1st January 2022
    'do MMM, yyyy', // 1st Jan, 2022
    'yyyy d M', // 2022 1 1
    'yyyy dd MM', // 2022 01 01
    'yyyy MMMM d', // 2022 January 1
    'yyyy MMM d', // 2022 Jan 1
    'yyyy do MMMM', // 2022 1st January
  ];

  function parseDate(input: string): string | null {
    const parsedDate = formats
      .map(fmt => DateTime.fromFormat(input, fmt))
      .find(date => date.isValid);

    return parsedDate ? parsedDate.toFormat(dateFormat) : null;
  }

  function generateDates(startDate: Date, endDate: Date): { name: string, value: string }[] {
    const dates = [];
    let currentDate = DateTime.fromJSDate(startDate);
    const endLuxonDate = DateTime.fromJSDate(endDate);

    while (currentDate <= endLuxonDate) {
      const formattedDate = currentDate.toFormat(dateFormat);
      const dateInUTC = currentDate.toUTC().toFormat('yyyy-MM-dd');
      dates.push({ name: formattedDate, value: dateInUTC });
      currentDate = currentDate.plus({ days: 1 });
    }

    return dates;
  }

  function generateDatesAndNumbers(recentNumber: number): { name: string, value: string }[] {
    const datesAndNumbers = [];
    let currentDate = DateTime.local().plus({ minutes: 14 * 60 });

    for (let i = recentNumber; i >= 1; i -= 1) {
      const formattedDate = currentDate.toFormat(dateFormat);
      datesAndNumbers.push({ name: `${i} (${formattedDate})`, value: i.toString() });
      currentDate = currentDate.minus({ days: 1 });
    }

    return datesAndNumbers;
  }

  if (focusedOption === 'puzzle' && game === 'wordle') {
    const wordleNumbers = (await Wordle.todaysPuzzles()).map(Number); // Convert numbers to strings
    const recentNumber = Math.max(...wordleNumbers);
    const datesAndNumbers = generateDatesAndNumbers(recentNumber);
    const fuse = new Fuse(datesAndNumbers, { shouldSort: true, keys: ['name'] });
    const userInput = interaction.options.getFocused(true).value;
    const dateStr = parseDate(userInput);
    let results;
    if (dateStr === null) {
      results = fuse.search(userInput);
    } else {
      results = fuse.search(dateStr);
    }
    const top5 = results.slice(0, 5);
    // If the user's input is empty, respond with the most recent 5 numbers, otherwise respond with the search results
    if (!userInput) {
      interaction.respond(datesAndNumbers.slice(0, 5));
    } else {
      interaction.respond(top5.map((result: { item: { name: string, value: string } }) => result.item));
    }
  } else if (focusedOption === 'puzzle' && game === 'connections') {
    const connectionsNumbers = (await Connections.todaysPuzzles()).map(Number); // Convert numbers to strings
    const recentNumber = Math.max(...connectionsNumbers);
    const datesAndNumbers = generateDatesAndNumbers(recentNumber);
    const fuse = new Fuse(datesAndNumbers, { shouldSort: true, keys: ['name'] });
    const userInput = interaction.options.getFocused(true).value;
    const dateStr = parseDate(userInput);
    let results;
    if (dateStr === null) {
      results = fuse.search(userInput);
    } else {
      results = fuse.search(dateStr);
    }
    const top5 = results.slice(0, 5);
    // If the user's input is empty, respond with the most recent 5 numbers, otherwise respond with the search results
    if (!userInput) {
      interaction.respond(datesAndNumbers.slice(0, 5));
    } else {
      interaction.respond(top5.map((result: { item: any }) => result.item));
    }
  } else if (focusedOption === 'puzzle' && game === 'mini') {
    const miniDates = (await TheMini.todaysPuzzles()).map(String); // Convert dates to strings
    log.debug(F, `Mini dates: ${miniDates}`);
    const recentDateUTC = new Date(`${miniDates[0]}T00:00:00Z`);
    const recentDate = new Date(recentDateUTC.getTime() + 14 * 60 * 60 * 1000);
    log.debug(F, `Recent date: ${recentDate}`);
    const startDate = new Date('2024-01-01');
    const dates = miniDates.length ? generateDates(startDate, recentDate) : [{ name: 'No dates found', value: '' }];
    const reversedDates = dates.reverse();
    const fuse = new Fuse(reversedDates.map(date => date.name), { shouldSort: true, keys: ['name'] });
    const userInput = interaction.options.getFocused(true).value;
    const dateStr = parseDate(userInput);
    let results;
    if (dateStr === null) {
      results = fuse.search(userInput);
    } else {
      results = fuse.search(dateStr);
    }
    const top5 = results.slice(0, 5);
    // If the user's input is empty, respond with the most recent 5 dates, otherwise respond with the search results
    if (!userInput) {
      interaction.respond(reversedDates.slice(0, 5).map(date => ({ name: date.name, value: date.value })));
    } else {
      interaction.respond(top5.map(result => ({ name: result.item, value: result.item })));
    }
  }
}

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

async function autocompleteRoles(interaction: AutocompleteInteraction) {
  // This will find all the roles that the user has the ability to assign
  // This list can change depending on if the user is self-assigning or assigning to someone else
  if (!interaction.guild) return;
  if (!interaction.member) return;

  // log.debug(F, `Autocomplete requested for: ${interaction.commandName}`);

  const colorRoles = [
    { name: '💖 Tulip', value: env.ROLE_RED },
    { name: '🧡 Marigold', value: env.ROLE_ORANGE },
    { name: '💛 Daffodil', value: env.ROLE_YELLOW },
    { name: '💚 Waterlily', value: env.ROLE_GREEN },
    { name: '💙 Bluebell', value: env.ROLE_BLUE },
    { name: '💜 Hyacinth', value: env.ROLE_PURPLE },
    { name: '💗 Azalea', value: env.ROLE_PINK },
  ] as RoleDef[];

  const premiumColorRoles = [
    { name: '💖 Ruby', value: env.ROLE_DONOR_RED },
    { name: '🧡 Sunstone', value: env.ROLE_DONOR_ORANGE },
    { name: '💛 Citrine', value: env.ROLE_DONOR_YELLOW },
    { name: '💚 Jade', value: env.ROLE_DONOR_GREEN },
    { name: '💙 Sapphire', value: env.ROLE_DONOR_BLUE },
    { name: '💜 Amethyst', value: env.ROLE_DONOR_PURPLE },
    { name: '💗 Pezzottaite', value: env.ROLE_DONOR_PINK },
  ] as RoleDef[];

  const mindsetRoles = [
    { name: 'Drunk', value: env.ROLE_DRUNK },
    { name: 'High', value: env.ROLE_HIGH },
    { name: 'Rolling', value: env.ROLE_ROLLING },
    { name: 'Tripping', value: env.ROLE_TRIPPING },
    { name: 'Dissociating', value: env.ROLE_DISSOCIATING },
    { name: 'Stimming', value: env.ROLE_STIMMING },
    { name: 'Sedated', value: env.ROLE_SEDATED },
    { name: 'Sober', value: env.ROLE_CLEARMIND },
  ] as RoleDef[];

  // Check if interaction.member type is APIInteractionGuildMember
  const isMod = (interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR);
  const isTs = (interaction.member as GuildMember).roles.cache.has(env.ROLE_TRIPSITTER);

  const roleList = [] as { name: string, value: string }[];
  const command = interaction.options.getSubcommand();
  if (isMod) {
    // log.debug(F, 'User is a moderator');
    // If the user is a moderator, they can manage the:
    // NeedsHelp, Helper, Mindset, Verified, Occult and Contributor roles.
    // They can manage these roles on anyone, except other moderators and tripsitters.

    roleList.push(
      { name: 'NeedsHelp', value: env.ROLE_NEEDSHELP },
      { name: 'Helper', value: env.ROLE_HELPER },
      { name: 'Verified', value: env.ROLE_VERIFIED },
      { name: 'Contributor', value: env.ROLE_CONTRIBUTOR },
      { name: 'Occult', value: env.ROLE_OCCULT },
      { name: 'Underban', value: env.ROLE_UNDERBAN },
      { name: 'Legacy', value: env.ROLE_LEGACY },
      ...mindsetRoles,
      ...premiumColorRoles,
    );
  } else if (isTs) {
    log.debug(F, 'User is a tripsitter');
    // If the user is a tripsitter, they can manage the
    // NeedsHelp, Helper and Mindset roles.
    // They can manage these roles on anyone, except other tripsitters and moderators.
    roleList.push(
      { name: 'NeedsHelp', value: env.ROLE_NEEDSHELP },
      { name: 'Helper', value: env.ROLE_HELPER },
      ...mindsetRoles,
      ...premiumColorRoles,
    );
  } else {
    log.debug(F, 'User is not a moderator or tripsitter');
    log.debug(F, `Command is: ${command}`);
    // If the user is not a moderator or tripsitter, they can manage the
    // NeedsHelp, Helper, Contributor, Color and Mindset roles.
    // They can only mange their own roles.
    if (command === 'add') {
      // Everyone can add mindset roles
      roleList.push(
        ...mindsetRoles,
      );
      const isDonor = (interaction.member as GuildMember).roles.cache.has(env.ROLE_DONOR);
      const isPatron = (interaction.member as GuildMember).roles.cache.has(env.ROLE_PATRON);

      // If the user is a donor or patreon they have access to extra color roles
      if (isDonor || isPatron) {
        roleList.push(...premiumColorRoles);
      } else {
        roleList.push(...colorRoles);
      }
    }

    // Keep this here cuz while the team can remove any role, regular members can only remove roles they already have
    if (command === 'remove') {
      const potentialRoles = [
        { name: 'NeedsHelp', value: env.ROLE_NEEDSHELP },
        { name: 'Helper', value: env.ROLE_HELPER },
        { name: 'Contributor', value: env.ROLE_CONTRIBUTOR },
        { name: 'Occult', value: env.ROLE_OCCULT },
        ...colorRoles,
        ...mindsetRoles,
        ...premiumColorRoles,
      ];

      const potentialRoleIds = potentialRoles.map(role => role.value);

      const member = await (interaction.member as GuildMember).fetch();
      const memberRoles = member.roles.cache.map(role => ({ name: role.name, value: role.id }));

      // Get a list of all roles that match between memberRoles and potentialRoles
      const roles = memberRoles.map(role => {
        if (potentialRoleIds.includes(role.value)) {
          return { name: role.name, value: role.value };
        }
        return { name: '', value: '' };
      });

      const nonNullRoles = roles.filter(role => role.name !== '');

      // log.debug(F, `nonNullRoles: ${JSON.stringify(nonNullRoles, null, 2)}`);

      roleList.push(...nonNullRoles);
    }
  }

  const options = {
    // shouldSort: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      'name',
      'value',
    ],
  };

  const fuse = new Fuse(roleList, options);
  const focusedValue = interaction.options.getFocused();
  const results = fuse.search(focusedValue);
  if (results.length > 0) {
    // log.debug(F, `Results: ${JSON.stringify(results, null, 2)}`);
    interaction.respond(results.map(choice => (
      { name: choice.item.name, value: choice.item.value })));
  } else {
    // log.debug(F, `roleDict: ${JSON.stringify(roleDict, null, 2)}`);
    interaction.respond(roleList);
  }
}

async function autocompleteColors(interaction: AutocompleteInteraction) {
  const options = {
    shouldSort: true,
    keys: [
      'color',
    ],
  };
  const colorList = [
    { color: 'Default', hex: '000000', id: 'DEFAULT' },
    { color: 'Blurple', hex: '5865f2', id: 'BLURPLE' },
    { color: 'Greyple', hex: '99aab5', id: 'GREYPLE' },
    { color: 'White', hex: 'ffffff', id: 'WHITE' },
    { color: 'Aqua', hex: '1abc9c', id: 'AQUA' },
    { color: 'Green', hex: '57f287', id: 'GREEN' },
    { color: 'Blue', hex: '3498db', id: 'BLUE' },
    { color: 'Yellow', hex: 'fee75c', id: 'YELLOW' },
    { color: 'Purple', hex: '9b59b6', id: 'PURPLE' },
    { color: 'LuminousVividPink', hex: 'e91e63', id: 'LUMINOUS_VIVID_PINK' },
    { color: 'Fuchsia', hex: 'eb459e', id: 'FUCHSIA' },
    { color: 'Gold', hex: 'f1c40f', id: 'GOLD' },
    { color: 'Orange', hex: 'e67e22', id: 'ORANGE' },
    { color: 'Red', hex: 'ed4245', id: 'RED' },
    { color: 'Navy', hex: '34495e', id: 'NAVY' },
    { color: 'Grey', hex: '95a5a6', id: 'GREY' },
    { color: 'DarkerGrey', hex: '7f8c8d', id: 'DARKER_GREY' },
    { color: 'LightGrey', hex: 'bcc0c0', id: 'LIGHT_GREY' },
    { color: 'DarkButNotBlack', hex: '2c2f33', id: 'DARK_BUT_NOT_BLACK' },
    { color: 'NotQuiteBlack', hex: '23272a', id: 'NOT_QUITE_BLACK' },
    { color: 'DarkNavy', hex: '2c3e50', id: 'DARK_NAVY' },
    { color: 'DarkAqua', hex: '11806a', id: 'DARK_AQUA' },
    { color: 'DarkGreen', hex: '1f8b4c', id: 'DARK_GREEN' },
    { color: 'DarkBlue', hex: '206694', id: 'DARK_BLUE' },
    { color: 'DarkPurple', hex: '71368a', id: 'DARK_PURPLE' },
    { color: 'DarkVividPink', hex: 'ad1457', id: 'DARK_VIVID_PINK' },
    { color: 'DarkGold', hex: 'c27c0e', id: 'DARK_GOLD' },
    { color: 'DarkOrange', hex: 'a84300', id: 'DARK_ORANGE' },
    { color: 'DarkRed', hex: '992d22', id: 'DARK_RED' },
    { color: 'DarkGrey', hex: '979c9f', id: 'DARK_GREY' },
  ];

  const fuse = new Fuse(colorList, options);
  const focusedValue = interaction.options.getFocused();
  // log.debug(F, `focusedValue: ${focusedValue}`);
  const results = fuse.search(focusedValue);
  // log.debug(F, `Autocomplete results: ${results}`);
  if (results.length > 0) {
    const top25 = results.slice(0, 20);
    const listResults = top25.map(choice => ({
      name: choice.item.color,
      value: choice.item.hex,
    }));
    // log.debug(F, `list_results: ${listResults}`);
    interaction.respond(listResults);
  } else {
    const defaultDiscordColors = colorList.slice(0, 25);
    const listResults = defaultDiscordColors.map(choice => ({ name: choice.color, value: choice.hex }));
    // log.debug(F, `list_results: ${listResults}`);
    interaction.respond(listResults);
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
      name: (choice.item as any).quote.slice(0, 100),
      value: (choice.item as any).quote.slice(0, 100),
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
    const listResults = initialQuotes.map(choice => ({ name: choice.quote.slice(0, 100), value: choice.quote.slice(0, 100) }));
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
  } else if (interaction.commandName === 'role') {
    await autocompleteRoles(interaction);
  } else if (interaction.commandName === 'calc' && interaction.options.getSubcommand() === 'benzo') {
    await autocompleteBenzos(interaction);
  } else if (interaction.commandName === 'timezone') {
    await autocompleteTimezone(interaction);
  } else if (interaction.commandName === 'convert') {
    autocompleteConvert(interaction);
  } else if (interaction.commandName === 'reaction_role') {
    autocompleteColors(interaction);
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
  } else if (interaction.commandName === 'nyt') {
    await autocompleteNYT(interaction);
  } else { // If you don't need a specific autocomplete, return a list of drug names
    await autocompleteDrugNames(interaction);
  }
}
