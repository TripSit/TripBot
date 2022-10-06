import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const h2flow: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('h2flow')
    .setDescription('Welcome to the H2Flow Club!'),

  async execute(interaction:ChatInputCommandInteraction) {
    let sparklePoints = 0;

    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${interaction.member!.user.id}/discord/sparkle_points`);
      await ref.once('value', (data) => {
        if (data.val() !== null) {
          sparklePoints = data.val() + 1;
        }
      });
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

    const embed = embedTemplate()
      .setAuthor({
        name: 'Welcome to the H2Flow Club!',
        url: 'https://www.youtube.com/watch?v=6r17Ez9V3AQ&t=132s',
      })
      .setThumbnail('https://i.imgur.com/2niEJJO.png')
      .setColor(Colors.DarkBlue)
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
        {name: 'Your Sparkle Points:', value: `${sparklePoints}`, inline: true},
        {name: 'Your Aqua Badges:', value: `${aquaBadges}`, inline: true},
        {name: 'H2Flow Club Status:', value: `${platinumClub}`, inline: true},
      );

    interaction.reply({embeds: [embed], ephemeral: false});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
