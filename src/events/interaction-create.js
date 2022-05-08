'use strict';

// TODO: Syncronous fs operations

const PREFIX = require('path').parse(__filename).name;
const Fuse = require('fuse.js');
const _ = require('underscore'); // TODO: underscore.js
const logger = require('../utils/logger');
const template = require('../utils/embed-template');
const drugDataAll = require('../assets/drug_db_combined.json');
const drugDataTripsit = require('../assets/drug_db_tripsit.json');
const timezones = require('../assets/timezones.json');
const pillColors = require('../assets/pill_colors.json');
const pillShapes = require('../assets/pill_shapes.json');

const {
  ownerId,
  guildId,
  channel_moderators: channelModeratorsId,
} = process.env;

const drugNames = drugDataAll.map(d => d.name);

const timezoneNames = [];
for (let i = 0; i < timezones.length; i += 1) {
  timezoneNames.push(timezones[i].label);
}

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
  name: 'interactionCreate',

  async execute(interaction, client) {
    // print what the user typed in the interaction
    // const username = `${interaction.user.username}#${interaction.user.discriminator}`;
    // const command_name = `${interaction.commandName ? ` used ${interaction.commandName}` : ''}`;
    // const guild_message = `${interaction.guild ? ` in ${interaction.guild.name}` : 'DM'}`;
    // const message = `${interaction.message ? ` saying: ${interaction.message}` : ''}`;
    // const type = interaction.type;
    // const is_autocomplete = interaction.isAutocomplete();
    const userIsBot = interaction.user.bot;
    // const user_is_blacklisted = blacklist_users.includes(interaction.user.id);

    // logger.info(`[${PREFIX}] ${username}${command_name} (${type})${guild_message}${message}`);

    // check if the user is a bot and if so, ignore it
    if (userIsBot) { return logger.debug(`[${PREFIX}] Ignoring bot interaction`); }

    const blacklistUsers = [];
    global.guild_db.forEach(doc => {
      if (doc.value.isBanned) {
        blacklistUsers.push(doc.value.guild_id);
      }
    });

    // check if the interaction is a request for autocomplete
    if (interaction.isAutocomplete()) {
      logger.debug(`[${PREFIX}] Autocomplete requested for: ${interaction.commandName}`);
      if (interaction.commandName === 'pill_id') {
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
        logger.debug(`[${PREFIX}] Autocomplete results:`, results);
        if (results.length > 0) {
          const top25 = results.slice(0, 25);
          const listResults = top25.map(choice => ({
            name: choice.item.label,
            value: choice.item.label,
          }));
          logger.debug(`[${PREFIX}] list_results:`, listResults);
          interaction.respond(listResults);
        } else {
          const defaultTimezones = timezoneNames.slice(0, 25);
          const listResults = defaultTimezones.map(choice => ({ name: choice, value: choice }));
          logger.debug(`[${PREFIX}] list_results:`, listResults);
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
    }

    // check if the interaction is a button press
    if (interaction.isButton()) {
      const buttonID = interaction.customId;
      logger.debug(`[${PREFIX}] buttonID: ${buttonID}`);
      const command = client.commands.get(interaction.customId);
      logger.debug(`[${PREFIX}] command: ${command}`);
      const modChan = interaction.client.channels.cache.get(channelModeratorsId);

      if (buttonID === 'acknowledgebtn') {
        const embed = template.embedTemplate()
          .setColor('GREEN')
          .setDescription(`${interaction.user.username} has acknowledged their warning.`);
        modChan.send({ embeds: [embed] });
        interaction.reply('Thanks for understanding!');
      }

      if (buttonID === 'refusalbtn') {
        const guild = interaction.client.guilds.resolve(guildId);
        logger.debug(guild);
        guild.members.ban(interaction.user, { days: 7, reason: 'Refused warning' });
        const embed = template.embedTemplate()
          .setColor('RED')
          .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
        modChan.send({ embeds: [embed] });
        interaction.reply('Thanks for making this easy!');
      }

      if (buttonID === 'guildacknowledgebtn') {
        // Get the owner of the client
        await interaction.client.application.fetch();
        const botOwner = interaction.client.application.owner;
        logger.debug(`[${PREFIX}] bot_owner: ${botOwner}`);
        const embed = template.embedTemplate()
          .setColor('GREEN')
          .setDescription(`${interaction.user.username} has acknowledged their warning.`);
        botOwner.send({ embeds: [embed] });
        interaction.reply('Thanks for understanding!');
      }

      if (buttonID === 'warnbtn') {
        const embed = template.embedTemplate()
          .setColor('RED')
          .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
        modChan.send({ embeds: [embed] });
        interaction.reply('Thanks for making this easy!');
      }

      if (!command) return;

      try {
        logger.debug(`[${PREFIX}] Executing command: ${command.name}`);
        command.execute(interaction);
      } catch (error) {
        logger.error(error);
        interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
      return;
    }

    // // Cooldown logic
    // if (interaction.user.id !== ownerId) {
    //     if (cooldown.has(interaction.user.id)) {
    //     // / If the cooldown did not end
    //         interaction.reply({ content: 'Don\'t be a coconut ( ͡° ͜ʖ ͡°)', ephemeral: true });
    //         return;
    //     }
    //     else {
    //     // Set cooldown
    //         cooldown.add(interaction.user.id);
    //         setTimeout(() => {
    //         // Removes the user from the set after 1 minute
    //             cooldown.delete(interaction.user.id);
    //         }, cooldownTime);
    //     }
    // }

    // Failsafe to make sure only commands get past this point
    if (!interaction.isCommand()) return; // eslint-disable-line

    // Check if the user is in blacklist_users and if so, ignore it
    // logger.debug(`[${PREFIX}] blacklist_users: ${blacklist_users}`);
    if (blacklistUsers.includes(interaction.user.id)) {
      logger.debug(`[${PREFIX}] ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id}) is banned from using commands.`);
      return interaction.reply('You are banned from using commands.');
    }
    logger.debug(`[${PREFIX}] ${interaction.user.username} is not banned!`);

    const { commandName } = interaction;

    const command = client.commands.get(commandName);
    if (!command) return; // eslint-disable-line

    const commandsAdmin = ['invite', 'button', 'gban', 'gunban', 'uban', 'uunban', 'test', 'ping'];
    // const commands_pm = ['idose'];

    // Check if the command is in commands_admin list and then check to see if the user is moonbear
    if (commandsAdmin.includes(commandName) && interaction.user.id !== ownerId) {
      interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return; // eslint-disable-line
    }

    // // Check if the command is in the commands_pm list and check if the command came in from a DM
    // if (commands_pm.includes(commandName)) {
    //     if (interaction.inGuild() && interaction.user.id !== ownerId) {
    // eslint-disable-next-line
    //         interaction.reply({ content: 'This command is only available in DMs.', ephemeral: true });
    //         return;
    //     }
    // }

    try {
      command.execute(interaction);
    } catch (error) {
      logger.error(error);
      interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  },
};
