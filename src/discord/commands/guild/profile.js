'use strict';

const path = require('path');
const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../../global/services/firebaseAPI');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Return the user\'s profile!')
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to get info on!')
      .setRequired(true)),
  async execute(interaction, options) {
    let target = options || interaction.options.getMember('target');

    // let targetFromIrc = options ? false : null;
    // let targetFromDiscord = options ? true : null;
    // let targetIsMember = options ? true : null;

    // Determine target information
    if (typeof target !== 'object') {
      if (target.startsWith('<@') && target.endsWith('>')) {
        // If the target string starts with a < then it's likely a discord user
        // targetFromIrc = false;
        // targetFromDiscord = true;
        // targetIsMember = true;
        const targetId = target.slice(3, -1);
        logger.debug(`[${PREFIX}] targetId: ${targetId}`);
        try {
          target = await interaction.guild.members.fetch(target.id);
        } catch (err) {
          logger.error(err);
          return interaction.reply('Could not find that user!');
        }
      } else {
        // Do a whois lookup to the user
        let data = null;
        await global.ircClient.whois(target, async resp => {
          data = resp;
        });

        // This is a hack substanc3 helped create to get around the fact that the whois command
        // is asyncronous by default, so we need to make this syncronous
        while (data === null) {
          await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
        }
        // logger.debug(`[${PREFIX}] data ${JSON.stringify(data, null, 2)}`);
        if (!data.host) {
          const embed = template.embedTemplate();
          logger.debug(`[${PREFIX}] ${target} not found on IRC`);
          embed.setDescription(stripIndents`${target} is not found on IRC, did you spell that right?`);
          interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
        // targetFromIrc = true;
        // targetFromDiscord = false;
        // targetIsMember = false;
        target = data;
      }
    }

    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    if (!target) {
      const embed = template.embedTemplate()
        .setColor('RED')
        .setDescription('Target not found?');
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

    // Extract target data
    const [targetData] = await getUserInfo(target);
    const targetUsername = `${target.user.username}#${target.user.discriminator}`;

    const givenKarma = targetData.karma_given || 0;
    const takenKarma = targetData.karma_received || 0;
    let targetBirthday = 'Use /birthday to set a birthday!';

    if (targetData.discord) {
      if (targetData.birthday) {
        targetBirthday = targetData.birthday
          ? new Date(`${targetData.birthday[0]} ${targetData.birthday[1]}, 2022`)
          : 'Use /birthday to set a birthday!';
        logger.debug(`[${PREFIX}] targetBirthday: ${targetBirthday}`);
        logger.debug(`[${PREFIX}] typeof targetBirthday: ${typeof targetBirthday}`);
      }
    }

    const targetEmbed = template.embedTemplate()
      .setColor('BLUE')
      .setDescription(`${targetData.accountName}'s profile!`)
      .addFields(
        { name: 'Username', value: targetUsername, inline: true },
        { name: 'Nickname', value: `${target.nickname ? target.nickname : 'No nickname'}`, inline: true },
        { name: 'Timezone', value: `${targetData.timezone ? targetData.timezone : 'Use /time set to set a timezone!'}`, inline: true },
      )
      .addFields(
        { name: 'Account created', value: `${time(target.user.createdAt, 'R')}`, inline: true },
        { name: 'Joined', value: `${time(target.joinedAt, 'R')}`, inline: true },
        { name: 'Birthday', value: `${typeof targetBirthday === 'string' ? targetBirthday : time(targetBirthday, 'R')}`, inline: true },
      )
      .addFields(
        { name: 'Karma Given', value: `${givenKarma}`, inline: true },
        { name: 'Karma Received', value: `${takenKarma}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
      );

    interaction.reply({ embeds: [targetEmbed], ephemeral: false });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
