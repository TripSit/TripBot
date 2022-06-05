'use strict';

const path = require('path');
const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../utils/firebase');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Return the user\'s profile!')
    .addStringOption(option => option
      .setName('target')
      .setDescription('User to get info on!')
      .setRequired(true)),
  async execute(interaction, options) {
    let target = options || interaction.options.getString('target');

    // let targetFromIrc = options ? false : null;
    // let targetFromDiscord = options ? true : null;
    // let targetIsMember = options ? true : null;

    // Determine target information
    if (!options) {
      if (target.startsWith('<@') && target.endsWith('>')) {
        // If the target string starts with a < then it's likely a discord user
        // targetFromIrc = false;
        // targetFromDiscord = true;
        // targetIsMember = true;
        const targetId = target.slice(3, -1);
        logger.debug(`[${PREFIX}] targetId: ${targetId}`);
        target = await interaction.guild.members.fetch(targetId);
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

    const givenUpvote = targetData.discord.karma_given['<:ts_voteup:958721361587630210>'] || 0;
    const givenDownvote = targetData.discord.karma_given['<:ts_votedown:960161563849932892>'] || 0;
    const givenKarma = givenUpvote - givenDownvote;

    const takenDownvote = targetData.discord.karma_received['<:ts_votedown:960161563849932892>'] || 0;
    const takenUpvote = targetData.discord.karma_received['<:ts_voteup:958721361587630210>'] || 0;
    const takenKarma = takenUpvote - takenDownvote;

    const targetBirthday = targetData.birthday
      ? new Date(`${targetData.birthday[0]} ${targetData.birthday[1]}, 2022`)
      : 'Use /birthday to set a birthday!';
    logger.debug(`[${PREFIX}] targetBirthday: ${targetBirthday}`);
    logger.debug(`[${PREFIX}] typeof targetBirthday: ${typeof targetBirthday}`);

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
        { name: 'Karma Taken', value: `${takenKarma}`, inline: true },
        { name: '\u200B', value: '\u200B' },
      );

    interaction.reply({ embeds: [targetEmbed], ephemeral: false });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
