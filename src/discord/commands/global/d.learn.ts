import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  help,
  link,
  unlink,
  profile,
} from '../../../global/commands/g.learn';
import commandContext from '../../utils/context';
import { getDiscordMember } from '../../utils/guildMemberLookup';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

async function moodleHelp():Promise<EmbedBuilder> {
  const helpData = await help();
  return embedTemplate()
    .setTitle(helpData.title)
    .setDescription(helpData.description)
    .setFooter({
      text: helpData.footer,
    });
}

async function moodleLink(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  // Check if the discord_id option was used
  if (interaction.options.getString('discord_id')) {
    if (interaction.user.id !== env.DISCORD_OWNER_ID) {
      return embedTemplate()
        .setColor(Colors.Red)
        .setDescription(t(locale, 'learn', 'notAllowedToUse'));
    }

    // Check if the email given is valid
    if (!interaction.options.getString('email', true).includes('@')) {
      return embedTemplate()
        .setColor(Colors.Red)
        .setDescription(t(locale, 'learn', 'invalidEmail'));
    }

    return embedTemplate()
      .setDescription(await link(
        interaction.options.getString('email', true),
        interaction.options.getString('discord_id', true),
      ));
  }

  // Check if the email given is valid
  if (!interaction.options.getString('email', true).includes('@')) {
    return embedTemplate()
      .setColor(Colors.Red)
      .setDescription(t(locale, 'learn', 'invalidEmail'));
  }

  return embedTemplate()
    .setDescription(await link(
      interaction.options.getString('email', true),
      interaction.user.id,
    ));
}

async function moodleUnlink(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  if (interaction.options.getString('discord_id')) {
    if (interaction.user.id !== env.DISCORD_OWNER_ID) {
      return embedTemplate()
        .setColor(Colors.Red)
        .setDescription(t(locale, 'learn', 'notAllowedToUse'));
    }
    return embedTemplate()
      .setDescription(await unlink(
        interaction.options.getString('discord_id', true),
      ));
  }

  return embedTemplate()
    .setDescription(await unlink(interaction.user.id));
}

async function moodleProfile(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  const targets = interaction.options.getString('user')
    ? await getDiscordMember(interaction, interaction.options.getString('user', true))
    : [interaction.member as GuildMember];

  if (targets.length > 1) {
    return embedTemplate()
      .setColor(Colors.Red)
      .setTitle(t(locale, 'learn', 'foundMoreThanOne'))
      .setDescription(stripIndents`
        "${interaction.options.getString('user', true)}" returned ${targets.length} results!

        ${t(locale, 'learn', 'moreSpecific')}:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
  }

  if (targets.length === 0) {
    return embedTemplate()
      .setColor(Colors.Red)
      .setTitle(t(locale, 'learn', 'foundNoUsers'))
      .setDescription(stripIndents`
        "${interaction.options.getString('user', true)}" returned no results!

        ${t(locale, 'learn', 'moreSpecific')}:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
  }

  const [discordMember] = targets;

  // log.debug(F, `discordMember: ${JSON.stringify(discordMember)}`);

  if (!discordMember) {
    return new EmbedBuilder()
      .setDescription(t(locale, 'learn', 'memberNotFound'));
  }

  const moodleProfileData = await profile(discordMember.id);
  // log.debug(F, `moodleProfileData: ${JSON.stringify(moodleProfileData)}`);

  if (!moodleProfileData.fullName) {
    return new EmbedBuilder()
      .setDescription(t(locale, 'learn', 'notLinked', { user: discordMember.displayName }));
  }

  // Make a string that says 'this user has completed the following courses:
  // course1, course2, course3'
  const completedCourses = moodleProfileData.completedCourses
    .join('\n *');

  // Make a string that says 'this user is enrolled in the following courses:
  // course1, course2, course3'
  const incompleteCourses = moodleProfileData.incompleteCourses
    .join('\n* ');

  const title = ` - ${moodleProfileData.department} of ${moodleProfileData.institution}\n`;

  const profileEmbed = new EmbedBuilder()
    .setAuthor({
      name: `${discordMember.displayName}${moodleProfileData.department && moodleProfileData.institution ? title : ''}`,
      url: env.MOODLE_URL,
    });

  if (completedCourses.length > 0) {
    profileEmbed.addFields([
      {
        name: t(locale, 'learn', 'completedCourses'),
        value: completedCourses,
        inline: false,
      },
    ]);
  }

  if (incompleteCourses.length > 0) {
    profileEmbed.addFields([

      {
        name: t(locale, 'learn', 'enrolledCourses'),
        value: incompleteCourses,
        inline: false,
      },
    ]);
  }

  return profileEmbed;
}

export const dLearn: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('learn')
    .setNameLocalizations(getCommandLocalizations('learn', 'commandName'))
    .setDescription('Commands related to TripSit\'s learning portal')
    .setDescriptionLocalizations(getCommandLocalizations('learn', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('help')
      .setNameLocalizations(getCommandLocalizations('learn', 'helpName'))
      .setDescription(t('en', 'learn', 'helpSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('learn', 'helpSubcommand'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en', 'learn', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('learn', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('link')
      .setNameLocalizations(getCommandLocalizations('learn', 'linkName'))
      .setDescription(t('en', 'learn', 'linkSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('learn', 'linkSubcommand'))
      .addStringOption(option => option.setName('email')
        .setDescription(t('en', 'learn', 'emailOption'))
        .setDescriptionLocalizations(getCommandLocalizations('learn', 'emailOption'))
        .setRequired(true))
      .addStringOption(option => option.setName('discord_id')
        .setDescription(t('en', 'learn', 'adminOnlyOption'))
        .setDescriptionLocalizations(getCommandLocalizations('learn', 'adminOnlyOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('unlink')
      .setNameLocalizations(getCommandLocalizations('learn', 'unlinkName'))
      .setDescription(t('en', 'learn', 'unlinkSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('learn', 'unlinkSubcommand'))
      .addStringOption(option => option.setName('discord_id')
        .setDescription(t('en', 'learn', 'adminOnlyOption'))
        .setDescriptionLocalizations(getCommandLocalizations('learn', 'adminOnlyOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('profile')
      .setNameLocalizations(getCommandLocalizations('learn', 'profileName'))
      .setDescription(t('en', 'learn', 'profileSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('learn', 'profileSubcommand'))
      .addStringOption(option => option.setName('user')
        .setDescription(t('en', 'learn', 'userOption'))
        .setDescriptionLocalizations(getCommandLocalizations('learn', 'userOption')))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en', 'learn', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('learn', 'ephemeralOption')))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'learn');
    // Below is if you just want a response (non-modal) command
    let ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    let embed = embedTemplate();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'link' || subcommand === 'unlink') {
      ephemeral = MessageFlags.Ephemeral;
    }
    await interaction.deferReply({ flags: ephemeral });

    switch (subcommand) {
      case 'help':
        embed = await moodleHelp();
        break;
      case 'link':
        embed = await moodleLink(interaction, locale);
        break;
      case 'unlink':
        embed = await moodleUnlink(interaction, locale);
        break;
      case 'profile':
        embed = await moodleProfile(interaction, locale);
        break;
      default:
        break;
    }

    await interaction.editReply({
      embeds: [embed],
    });

    return true;
  },
};

export default dLearn;
