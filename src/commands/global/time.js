const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const PREFIX = require('path').parse(__filename).name;

const timezones = JSON.parse(fs.readFileSync('./src/assets/timezones.json'));
const template = require('../../utils/embed-template');
const { get_user_info } = require('../../utils/get_user_info');

const { users_db_name } = process.env;
const { db } = global;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('time')
    .setDescription('Get the time of another user!')
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Set your own timezone')
      .addStringOption(option => option
        .setName('timezone')
        .setDescription('Timezone value')
        .setRequired(true)
        .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get someone\'s time!')
      .addUserOption(option => option.setName('user').setDescription('User to lookup!'))),
  async execute(interaction) {
    const timezone = interaction.options.getString('timezone');
    let target = interaction.options.getMember('user');
    if (!target) {
      target = interaction.member;
    }

    const actor = interaction.user;

    let command = '';
    try {
      command = interaction.options.getSubcommand();
    } catch (err) {
      command = 'get';
    }

    if (command == 'set') {
      logger.debug(`${PREFIX} time: ${timezone}`);
      // define offset as the value from the timezones array
      let tzCode = '';
      for (let i = 0; i < timezones.length; i++) {
        if (timezones[i].label === timezone) {
          tzCode = timezones[i].tzCode;
          logger.debug(`${PREFIX} tzCode: ${tzCode}`);
        }
      }
      // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);

      const actor_results = get_user_info(actor);
      const actor_data = actor_results[0];
      const actor_fbid = actor_results[1];

      if ('timezone' in actor_data) {
        if (actor_data.timezone == tzCode) {
          const embed = template.embedTemplate()
            .setDescription(`${timezone} already is your timezone, you don't need to update it!`);
          interaction.reply({ embeds: [embed], ephemeral: true });
          logger.debug(`[${PREFIX}] Done!!`);
          return;
        }
      }

      actor_data.timezone = tzCode;

      if (actor_fbid !== '') {
        logger.debug(`[${PREFIX}] Updating actor data`);
        try {
          await db.collection(users_db_name).doc(actor_fbid).set(actor_data);
        } catch (err) {
          logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
        }
      } else {
        logger.debug(`[${PREFIX}] Creating actor data`);
        try {
          await db.collection(users_db_name).doc().set(actor_data);
        } catch (err) {
          logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
        }
      }
      const embed = template.embedTemplate()
        .setDescription(`I set your timezone to ${timezone}`);
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] Done!!`);
      return;
    }
    if (command == 'get') {
      let tzCode = '';

      const target_results = get_user_info(target);
      const target_data = target_results[0];

      if ('timezone' in target_data) {
        tzCode = target_data.timezone;
      }

      if (!tzCode) {
        const embed = template.embedTemplate()
          .setDescription(`${target.user.username} is a timeless treasure <3 (and has not set a time zone)`);
        interaction.reply({ embeds: [embed], ephemeral: false });
        logger.debug(`[${PREFIX}] Done!!`);
        return;
      }

      // get the user's timezone from the database
      const time_string = new Date().toLocaleTimeString('en-US', { timeZone: tzCode });
      const embed = template.embedTemplate()
        .setDescription(`It is likely ${time_string} wherever ${target.user.username} is located.`);
      if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false }); } else { interaction.followUp({ embeds: [embed], ephemeral: false }); }
      logger.debug(`[${PREFIX}] finished!`);
    }
  },
};
