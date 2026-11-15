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
import { getOrCreateUser } from '../../../global/utils/dbRecords';

const F = f(__filename);

// Club by total points: the highest threshold reached wins
const CLUBS: [number, string][] = [
  [1000, 'Diamond Club'],
  [900, 'Ruby Club'],
  [800, 'Sapphire Club'],
  [700, 'Emerald Club'],
  [600, 'Platinum Club'],
  [500, 'Gold Club'],
  [400, 'Silver Club'],
  [300, 'Bronze Club'],
  [200, 'Copper Club'],
  [100, 'Tin Club'],
  [50, 'Aluminum Club'],
  [25, 'Steel Club'],
  [10, 'Iron Club'],
  [5, 'Bronze Club'],
  [1, 'Copper Club'],
];

const clubForPoints = (totalPoints: number): string => (
  CLUBS.find(([threshold]) => totalPoints >= threshold)?.[1] ?? 'Non-member =('
);

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
    const userData = await getOrCreateUser(interaction.user.id);

    const sparklePoints = userData.sparkle_points;
    const movePoints = userData.move_points;
    const lovePoints = userData.empathy_points;
    const totalPoints = sparklePoints + movePoints + lovePoints;
    const platinumClub = clubForPoints(totalPoints);

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
