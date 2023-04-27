import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  GuildMember,
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
):Promise<EmbedBuilder> {
  // Check if the admin_only option was used
  if (interaction.options.getString('admin_only')) {
    if (interaction.user.id !== env.DISCORD_OWNER_ID) {
      return embedTemplate()
        .setColor(Colors.Red)
        .setDescription('You are not allowed to use this option!');
    }
    return embedTemplate()
      .setDescription(await link(
        undefined,
        interaction.options.getString('email', true),
        interaction.options.getString('admin_only', true),
      ));
  }

  // Check if the email given is valid
  if (!interaction.options.getString('email', true).includes('@')) {
    return embedTemplate()
      .setColor(Colors.Red)
      .setDescription('That doesn\'t look like a valid email address!');
  }

  return embedTemplate()
    .setDescription(await link(
      interaction.options.getString('email', true),
      undefined,
      interaction.user.id,
    ));
}

async function moodleUnlink(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  if (interaction.options.getString('admin_only')) {
    if (interaction.user.id !== env.DISCORD_OWNER_ID) {
      return embedTemplate()
        .setColor(Colors.Red)
        .setDescription('You are not allowed to use this option!');
    }
    return embedTemplate()
      .setDescription(await unlink(
        interaction.options.getString('admin_only', true),
      ));
  }

  return embedTemplate()
    .setDescription(await unlink(interaction.user.id));
}

async function moodleProfile(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const targets = interaction.options.getString('user')
    ? await getDiscordMember(interaction, interaction.options.getString('user', true))
    : [interaction.member as GuildMember];

  if (targets.length > 1) {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setTitle('Found more than one user with with that value!')
      .setDescription(stripIndents`
        "${interaction.options.getString('user', true)}" returned ${targets.length} results!

        Be more specific:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }

  if (targets.length === 0) {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setTitle('Found no users with that value!')
      .setDescription(stripIndents`
        "${interaction.options.getString('user', true)}" returned no results!

        Be more specific:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }

  const [discordMember] = targets;

  log.debug(F, `discordMember: ${JSON.stringify(discordMember)}`);

  if (!discordMember) {
    return new EmbedBuilder()
      .setDescription('Member not found!');
  }

  const moodleProfileData = await profile(discordMember.id);
  log.debug(F, `moodleProfileData: ${JSON.stringify(moodleProfileData)}`);

  if (!moodleProfileData.fullName) {
    return new EmbedBuilder()
      .setDescription(`${discordMember.displayName} does not have a linked TSL account!
      Ask them to sign up and use \`/learn link\` to link their account!
      `);
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
      name: `${moodleProfileData.fullName}${moodleProfileData.department && moodleProfileData.institution ? title : ''}`,
      url: env.MOODLE_URL,
    })
    .setThumbnail(moodleProfileData.profileImage);

  if (completedCourses.length > 0) {
    profileEmbed.addFields([
      {
        name: 'Completed Courses',
        value: completedCourses,
        inline: false,
      },
    ]);
  }

  if (incompleteCourses.length > 0) {
    profileEmbed.addFields([

      {
        name: 'Enrolled Courses',
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
    .setDescription('Commands related to TripSit\'s learning portal')
    .addSubcommand(subcommand => subcommand
      .setName('help')
      .setDescription('Information about this command')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('link')
      .setDescription('Link your discord with your TripSitLearn account')
      .addStringOption(option => option.setName('email')
        .setDescription('What email did you use to register on moodle?')
        .setRequired(true))
      .addStringOption(option => option.setName('admin_only')
        .setDescription('Ignore this, admin use only!')))
    .addSubcommand(subcommand => subcommand
      .setName('unlink')
      .setDescription('Unlink your discord with your TripSitLearn account')
      .addStringOption(option => option.setName('admin_only')
        .setDescription('Ignore this, admin use only!')))
    .addSubcommand(subcommand => subcommand
      .setName('profile')
      .setDescription('Show someone\'s TripSitLearn profile, including the courses they have completed!')
      .addStringOption(option => option.setName('user')
        .setDescription('Who are you looking up? Defaults to you.'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    // Below is if you just want a response (non-modal) command
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') !== false) });

    let embed = embedTemplate();

    switch (interaction.options.getSubcommand()) {
      case 'help':
        embed = await moodleHelp();
        break;
      case 'link':
        embed = await moodleLink(interaction);
        break;
      case 'unlink':
        embed = await moodleUnlink(interaction);
        break;
      case 'profile':
        embed = await moodleProfile(interaction);
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
