'use strict';

const path = require('path');
const { stripIndents } = require('common-tags/lib');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../../global/services/firebaseAPI');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('h2flow')
    .setDescription('Welcome to the H2Flow Club!'),

  async execute(interaction) {
    const actor = interaction.member;

    // Extract actor data
    const [actorData] = await getUserInfo(actor);

    let sparklePoints = 0;
    try {
      sparklePoints = actorData.discord.sparkle_points || 0;
    } catch (e) {
      logger.error(`[${PREFIX}] Error extracting sparkle points: ${e}`);
    }
    const aquaBadges = sparklePoints / 10;
    let platinumClub = 'Non-member =(';
    if (sparklePoints >= 100) {
      platinumClub = 'Tin Club';
    } else if (sparklePoints >= 200) {
      platinumClub = 'Copper Club';
    } else if (sparklePoints >= 300) {
      platinumClub = 'Bronze Club';
    } else if (sparklePoints >= 400) {
      platinumClub = 'Silver Club';
    } else if (sparklePoints >= 500) {
      platinumClub = 'Gold Club';
    } else if (sparklePoints >= 600) {
      platinumClub = 'Platinum Club';
    } else if (sparklePoints >= 700) {
      platinumClub = 'Emerald Club';
    } else if (sparklePoints >= 800) {
      platinumClub = 'Sapphire Club';
    } else if (sparklePoints >= 900) {
      platinumClub = 'Ruby Club';
    } else if (sparklePoints >= 1000) {
      platinumClub = 'Diamond Club';
    }

    const embed = template.embedTemplate()
      .setAuthor({
        name: 'Welcome to the H2Flow Club!',
        url: 'https://www.youtube.com/watch?v=6r17Ez9V3AQ&t=132s',
      })
      .setThumbnail('https://i.imgur.com/2niEJJO.png')
      .setColor('DARK_BLUE')
      .setDescription(stripIndents`
      These are not useless internet points...
      This is an aqautic💧based social🌐media oral🦷experience!

      Think about H2Flow as an app📱for your 💧 intake 🤔

      Every so often you'll see a a ⚠️💧hydration reminder💧⚠️

      Drink some 💧 and react with the 💧 emoji!

      The more 💧 you give, the more ✨sparkle✨points✨ you get!

      If you get enough ✨ then you're on your way to your first

      **🌊Aqua🌊🔰Badge🔰!**

      If you get enough 🌊🔰 and we'll welcome you to the

      **🏆*H2Flow Club*🏆!**`)
      .setFooter(null)
      .addFields(
        { name: 'Your Sparkle Points:', value: `${sparklePoints}`, inline: true },
        { name: 'Your Aqua Badges:', value: `${aquaBadges}`, inline: true },
        { name: 'H2Flow Club Status:', value: `${platinumClub}`, inline: true },
      );

    interaction.reply({ embeds: [embed], ephemeral: false });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
