import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

// import log from '../../../global/utils/log';

const F = f(__filename);

export const dH2flow: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('h2flow')
    .setNameLocalizations(getCommandLocalizations('h2flow', 'commandName'))
    .setDescription(t('en-US', 'h2flow', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('h2flow', 'commandDescription'))
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en-US', 'h2flow', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('h2flow', 'ephemeralOption'))) as SlashCommandBuilder,

  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'h2flow');
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
    let clubKey = 'nonMember';
    if (totalPoints >= 1000) clubKey = 'diamondClub';
    else if (totalPoints >= 900) clubKey = 'rubyClub';
    else if (totalPoints >= 800) clubKey = 'sapphireClub';
    else if (totalPoints >= 700) clubKey = 'emeraldClub';
    else if (totalPoints >= 600) clubKey = 'platinumClub';
    else if (totalPoints >= 500) clubKey = 'goldClub';
    else if (totalPoints >= 400) clubKey = 'silverClub';
    else if (totalPoints >= 300) clubKey = 'bronzeClub';
    else if (totalPoints >= 200) clubKey = 'copperClub';
    else if (totalPoints >= 100) clubKey = 'tinClub';
    else if (totalPoints >= 50) clubKey = 'aluminumClub';
    else if (totalPoints >= 25) clubKey = 'steelClub';
    else if (totalPoints >= 10) clubKey = 'ironClub';
    else if (totalPoints >= 5) clubKey = 'bronzeClub';
    else if (totalPoints >= 1) clubKey = 'copperClub';
    const platinumClub = t(locale, 'h2flow', clubKey);

    const embed = embedTemplate()
      .setAuthor({
        name: t(locale, 'h2flow', 'embedAuthor'),
        url: 'https://www.youtube.com/watch?v=6r17Ez9V3AQ&t=132s',
      })
      .setThumbnail('https://i.imgur.com/2niEJJO.png')
      .setColor(Colors.Blue)
      .setDescription(t(locale, 'h2flow', 'embedDescription'))
      .setFooter({ text: t(locale, 'h2flow', 'embedFooter', { status: platinumClub }) })
      .addFields(
        {
          name: t(locale, 'h2flow', 'aquaBadgesField', { count: String(Math.floor(userData.sparkle_points / 10)) }),
          value: t(locale, 'h2flow', 'aquaBadgesValue', { points: String(userData.sparkle_points) }),
          inline: true,
        },
        {
          name: t(locale, 'h2flow', 'loveCupsField', { count: String(Math.floor(userData.empathy_points / 10)) }),
          value: t(locale, 'h2flow', 'loveCupsValue', { points: String(userData.empathy_points) }),
          inline: true,
        },
        {
          name: t(locale, 'h2flow', 'moveMedalsField', { count: String(Math.floor(userData.move_points / 10)) }),
          value: t(locale, 'h2flow', 'moveMedalsValue', { points: String(userData.move_points) }),
          inline: true,
        },
      );

    await interaction.editReply({ embeds: [embed] });

    return false;
  },
};

export default dH2flow;
