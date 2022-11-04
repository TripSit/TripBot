import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {startLog} from '../../utils/startLog';
import {stripIndents} from 'common-tags';
import {h2flow} from '../../../global/commands/g.h2flow';

// import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const dH2flow: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('h2flow')
    .setDescription('Welcome to the H2Flow Club!'),

  async execute(interaction:ChatInputCommandInteraction) {
    startLog(PREFIX, interaction);
    const data = await h2flow(interaction.user.id);

    const sparklePoints = data.sparkle_points;
    const movePoints = data.move_points;
    const lovePoints = data.empathy_points;
    const totalPoints = sparklePoints + movePoints + lovePoints;
    let platinumClub = 'Non-member =(';
    if (totalPoints >= 100) {
      platinumClub = 'Tin Club';
    } else if (totalPoints >= 200) {
      platinumClub = 'Copper Club';
    } else if (totalPoints >= 300) {
      platinumClub = 'Bronze Club';
    } else if (totalPoints >= 400) {
      platinumClub = 'Silver Club';
    } else if (totalPoints >= 500) {
      platinumClub = 'Gold Club';
    } else if (totalPoints >= 600) {
      platinumClub = 'Platinum Club';
    } else if (totalPoints >= 700) {
      platinumClub = 'Emerald Club';
    } else if (totalPoints >= 800) {
      platinumClub = 'Sapphire Club';
    } else if (totalPoints >= 900) {
      platinumClub = 'Ruby Club';
    } else if (totalPoints >= 1000) {
      platinumClub = 'Diamond Club';
    }

    const embed = embedTemplate()
      .setAuthor({
        name: 'What is the H2Flow club?',
        url: 'https://www.youtube.com/watch?v=6r17Ez9V3AQ&t=132s',
      })
      .setThumbnail('https://i.imgur.com/2niEJJO.png')
      .setColor(Colors.DarkBlue)
      .setDescription(stripIndents`
      These are not useless internet points✨
      This is an emoji-based social🌐media experience!
      Think about H2Flow as app📱for your health 🩺
      Every so often you'll see a reminder to be healthy🧘‍♂️
      Move around🕴, drink some water💧, or spread love💖
      Perform the action, react to the message, get your points✨!
      You can only get one point✨ per message, so pay attention!
      If you get enough ✨ then you're on your way to your first
      **🌊AquaBadge🔰** or **💖LoveCup🏆** or **🏃Move Medal🏅**!
      Get enough 🌊🔰, 💖🏆 or 🏃🏅 and you'll level up!
      Level up enoough and we'll welcome you to the fabled
      ☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ🥇*H2Flow Club*🥇☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ`)
      .setFooter({text: `H2Flow Club Status: ${platinumClub}`})
      .addFields(
        {
          name: `**${Math.floor(data.sparkle_points / 10)}** 🌊Aqua Badges🔰`,
          value: `${data.sparkle_points} sparkle points`, inline: true},
        {
          name: `**${Math.floor(data.empathy_points / 10)}** 💖Love Cups🏆`,
          value: `${data.empathy_points} empathy points`, inline: true},
        {
          name: `**${Math.floor(data.move_points / 10)}** 🏃Move Medals🏅`,
          value: `${data.move_points} active points`, inline: true},
      );

    interaction.reply({embeds: [embed], ephemeral: false});

    return false;
  },
};
