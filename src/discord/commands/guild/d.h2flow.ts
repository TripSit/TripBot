import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

// import log from '../../../global/utils/log';

const F = f(__filename);

export const dH2flow: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('h2flow')
    .setDescription('Welcome to the H2Flow Club!')
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const userData = await db.users.upsert({
      where: {
        discord_id: interaction.user.id,
      },
      create: {
        discord_id: interaction.user.id,
      },
      update: {},
    });

    const sparklePoints = userData.sparkle_points;
    const movePoints = userData.move_points;
    const lovePoints = userData.empathy_points;
    const totalPoints = sparklePoints + movePoints + lovePoints;
    let platinumClub = 'Non-member =(';
    if (totalPoints >= 1000) platinumClub = 'Diamond Club';
    else if (totalPoints >= 900) platinumClub = 'Ruby Club';
    else if (totalPoints >= 800) platinumClub = 'Sapphire Club';
    else if (totalPoints >= 700) platinumClub = 'Emerald Club';
    else if (totalPoints >= 600) platinumClub = 'Platinum Club';
    else if (totalPoints >= 500) platinumClub = 'Gold Club';
    else if (totalPoints >= 400) platinumClub = 'Silver Club';
    else if (totalPoints >= 300) platinumClub = 'Bronze Club';
    else if (totalPoints >= 200) platinumClub = 'Copper Club';
    else if (totalPoints >= 100) platinumClub = 'Tin Club';
    else if (totalPoints >= 50) platinumClub = 'Aluminum Club';
    else if (totalPoints >= 25) platinumClub = 'Steel Club';
    else if (totalPoints >= 10) platinumClub = 'Iron Club';
    else if (totalPoints >= 5) platinumClub = 'Bronze Club';
    else if (totalPoints >= 1) platinumClub = 'Copper Club';

    const embed = embedTemplate()
      .setAuthor({
        name: 'What is the H2Flow club?',
        url: 'https://www.youtube.com/watch?v=6r17Ez9V3AQ&t=132s',
      })
      .setThumbnail('https://i.imgur.com/2niEJJO.png')
      .setColor(Colors.Blue)
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
      Level up enough and we'll welcome you to the fabled
      ☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ🥇*H2Flow Club*🥇☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ`)
      .setFooter({ text: `H2Flow Club Status: ${platinumClub}` })
      .addFields(
        {
          name: `**${Math.floor(userData.sparkle_points / 10)}** 🌊Aqua Badges🔰`,
          value: `${userData.sparkle_points} sparkle points`,
          inline: true,
        },
        {
          name: `**${Math.floor(userData.empathy_points / 10)}** 💖Love Cups🏆`,
          value: `${userData.empathy_points} empathy points`,
          inline: true,
        },
        {
          name: `**${Math.floor(userData.move_points / 10)}** 🏃Move Medals🏅`,
          value: `${userData.move_points} active points`,
          inline: true,
        },
      );

    await interaction.editReply({ embeds: [embed] });

    return false;
  },
};

export default dH2flow;
