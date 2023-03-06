import {
  AutocompleteInteraction, GuildMember,
} from 'discord.js';
import Fuse from 'fuse.js';

import pillColors from '../../global/assets/data/pill_colors.json';
import pillShapes from '../../global/assets/data/pill_shapes.json';
import drugDataAll from '../../global/assets/data/drug_db_combined.json';
import drugDataTripsit from '../../global/assets/data/drug_db_tripsit.json';
import timezones from '../../global/assets/data/timezones.json';
import unitsOfMeasurement from '../../global/assets/data/units_of_measurement.json';

const F = f(__filename); // eslint-disable-line

type RoleDef = { name: string; value: string };

const timezoneNames:string[] = [];
for (const timezone of timezones) { // eslint-disable-line
  timezoneNames.push(timezone.label);
}

const measurementNames:string[] = [];
for (const unit of unitsOfMeasurement) { // eslint-disable-line
  measurementNames.push(unit.abbr);
}

const pillColorNames:string[] = [];
for (const color of pillColors) { // eslint-disable-line
  pillColorNames.push(Object.keys(color)[0]);
}
const defaultColors = pillColorNames.slice(0, 25);
// log.debug(F, `pill_color_names: ${pill_color_names}`);

const pillShapeNames:string[] = [];
for (const shape of pillShapes) { // eslint-disable-line
  pillShapeNames.push(Object.keys(shape)[0]);
}
const defaultShapes = pillShapeNames.slice(0, 25);
// log.debug(F, `pill_shape_names: ${pill_shape_names}`);

async function autocompletePills(interaction:AutocompleteInteraction) {
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
}

async function autocompleteBenzos(interaction:AutocompleteInteraction) {
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
}

async function autocompleteTimezone(interaction:AutocompleteInteraction) {
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

async function autocompleteConvert(interaction:AutocompleteInteraction) {
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

async function autocompleteDrugNames(interaction:AutocompleteInteraction) {
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

async function autocompleteRoles(interaction:AutocompleteInteraction) {
  // This will find all the roles that the user has the ability to assign
  // This list can change depending on if the user is self-assigning or assigning to someone else
  if (!interaction.guild) return;
  if (!interaction.member) return;

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
    { name: 'Sober', value: env.ROLE_SOBER },
  ] as RoleDef[];

  // Check if interaction.member type is APIInteractionGuildMember
  const isMod = (interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR);
  const isTs = (interaction.member as GuildMember).roles.cache.has(env.ROLE_TRIPSITTER);

  const roleList = [] as { name:string, value:string }[];
  const command = interaction.options.getSubcommand();
  if (isMod) {
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
      ...mindsetRoles,
      ...premiumColorRoles,
    );
  } else if (isTs) {
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

  const roleDict = roleList.map(role => ({ name: role.name, value: role.value }));

  const fuse = new Fuse(roleDict, options);
  const focusedValue = interaction.options.getFocused();
  const results = fuse.search(focusedValue);
  if (results.length > 0) {
    // log.debug(F, `Results: ${JSON.stringify(results, null, 2)}`);
    interaction.respond(results.map(choice => (
      { name: choice.item.name, value: choice.item.name })));
  } else {
    // log.debug(F, `roleDict: ${JSON.stringify(roleDict, null, 2)}`);
    interaction.respond(roleDict);
  }
}

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
    await autocompletePills(interaction);
  } else if (interaction.commandName === 'role') {
    await autocompleteRoles(interaction);
  } else if (interaction.commandName === 'calc_benzo') {
    await autocompleteBenzos(interaction);
  } else if (interaction.commandName === 'timezone') {
    await autocompleteTimezone(interaction);
  } else if (interaction.commandName === 'convert') {
    autocompleteConvert(interaction);
  } else { // If you don't need a specific autocomplete, return a list of drug names
    await autocompleteDrugNames(interaction);
  }
}
