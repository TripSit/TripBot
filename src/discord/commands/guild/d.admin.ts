import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
  ActivityType,
} from 'discord.js';
import axios from 'axios';
import { stripIndents } from 'common-tags';
import {
  experience_category, experience_type,
} from '@prisma/client';
import { findXPfromLevel } from '../../../global/utils/experience';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import deployCommands from '../../utils/commandDeploy';

const F = f(__filename);

async function restart(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  log.info(F, 'Restarting');
  await interaction.editReply('Restarting');
  const channelTripbot = interaction.guild?.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
  if (channelTripbot) {
    await channelTripbot.send(`${interaction.member} restarted the bot <@${env.DISCORD_OWNER_ID}>.`);
  }
  // This doesn't work for some reason
  // Process.exit() doesn't work in a lambda function
  process.kill(process.pid, 'SIGTERM');
}

async function rebuild(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  log.info(F, 'Rebuilding');
  await interaction.editReply('Rebuilding');
  const channelTripbot = interaction.guild?.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
  if (channelTripbot) {
    await channelTripbot.send(`${interaction.member} triggered a rebuild <@${env.DISCORD_OWNER_ID}>.`);
  }

  axios.post('https://drone.tripsit.me/api/repos/TripSit/TripBot/builds', {}, {
    headers: { Authorization: `Bearer ${env.DRONE_TOKEN}` },
  })
    .then(response => {
      log.debug(F, `Build triggered successfully ${JSON.stringify(response.data, null, 2)}`);
    })
    .catch(error => {
      log.error(F, `Error triggering build ${JSON.stringify(error, null, 2)}`);
    });
}

async function deploy(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  log.info(F, 'Deploying commands');
  await interaction.editReply('Deploying commands!!');
  const channelTripbot = interaction.guild?.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
  if (channelTripbot) {
    await channelTripbot.send(`${interaction.member} triggered a command deploy <@${env.DISCORD_OWNER_ID}>.`);
  }
  const commandData = await deployCommands();
  // log.debug(F, `CommandData: ${JSON.stringify(commandData, null, 2)}`);
  log.info(F, stripIndents`
    I deployed ${commandData.globalCommands.length + commandData.guildCommands.length} commands!
    ${commandData.globalCommands.length} global commands and ${commandData.guildCommands.length} guild commands`);
  await interaction.editReply(stripIndents`
    I deployed ${commandData.globalCommands.length + commandData.guildCommands.length} commands!
    ${commandData.globalCommands.length} global commands and ${commandData.guildCommands.length} guild commands`);
}

async function setAvatar(interaction: ChatInputCommandInteraction, avatarUrl: string): Promise<boolean> {
  const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
  const base64 = Buffer.from(response.data, 'binary').toString('base64');
  const data = `data:image/jpeg;base64,${base64}`;

  await axios.patch('https://discord.com/api/v10/users/@me', {
    avatar: data,
  }, {
    headers: {
      Authorization: `Bot ${interaction.client.token}`,
      'Content-Type': 'application/json',
    },
  }).then(() => {
    log.info(F, 'Avatar set successfully');
    interaction.editReply('Avatar set successfully');
    return true;
  }).catch((error: Error) => {
    log.error(F, `Error setting avatar: ${error.message}`);
    interaction.editReply('Error setting avatar');
    return false;
  });
  return false;
}

async function setBanner(interaction: ChatInputCommandInteraction, bannerUrl: string): Promise<boolean> {
  const response = await axios.get(bannerUrl, { responseType: 'arraybuffer' });
  const base64 = Buffer.from(response.data, 'binary').toString('base64');
  const data = `data:image/jpeg;base64,${base64}`;

  await axios.patch('https://discord.com/api/v10/users/@me', {
    banner: data,
  }, {
    headers: {
      Authorization: `Bot ${interaction.client.token}`,
      'Content-Type': 'application/json',
    },
  }).then(() => {
    log.info(F, 'Banner set successfully');
    interaction.editReply('Banner set successfully');
    return true;
  }).catch((error: Error) => {
    log.error(F, `Error setting banner: ${error.message}`);
    interaction.editReply('Error setting banner');
    return false;
  });
  return false;
}

async function setStatus(
  interaction: ChatInputCommandInteraction,
  prefix: string,
  status: string,
): Promise<void> {
  let statusType: ActivityType;
  switch (prefix) {
    case 'none':
    case 'playing':
      statusType = ActivityType.Playing;
      break;
    case 'streaming':
      statusType = ActivityType.Streaming;
      break;
    case 'listening':
      statusType = ActivityType.Listening;
      break;
    case 'watching':
      statusType = ActivityType.Watching;
      break;
    case 'competing':
      statusType = ActivityType.Competing;
      break;
    default:
      statusType = ActivityType.Playing;
  }
  await interaction.client.user?.setActivity(status, { type: statusType });
  await interaction.editReply(`Status set to ${statusType} ${status}`);
}

async function overwriteUserData(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const member = interaction.options.getUser('user');
  if (!member) {
    await interaction.editReply('Error: User not found.');
    return;
  }

  const category = interaction.options.getString('category') as experience_category;
  const type = interaction.options.getString('type') as experience_type;
  const level = interaction.options.getInteger('level');

  if (!category || !type || level === null) {
    await interaction.editReply('Error: Missing category, type, or level.');
    return;
  }

  const userData = await db.users.upsert({
    where: {
      discord_id: member.id,
    },
    create: {
      discord_id: member.id,
    },
    update: {},
  });

  const experienceData = await db.user_experience.findFirst({
    where: {
      user_id: userData.id,
      category,
      type,
    },
  });

  if (!experienceData) {
    log.debug(F, `No experience data found for user ${userData.id} in category ${category} type ${type}.`);
    await interaction.editReply('Error: No experience data found for the user.');
    return;
  }

  const levelPoints = await findXPfromLevel(level);
  log.debug(F, `Overwriting user data for user ${userData.id} in category ${category} type ${type} to level ${level} with ${levelPoints} XP points.`);

  try {
    const result = await db.user_experience.updateMany({
      where: {
        user_id: userData.id,
        category,
        type,
      },
      data: {
        level,
        level_points: levelPoints,
        total_points: levelPoints,
      },
    });
    log.info(F, `Update result: ${JSON.stringify(result)}`);
  } catch (error) {
    log.error(F, `Error updating database: ${(error as Error).message}`);
  }

  await interaction.editReply(`User level and points updated for category ${category} to level ${level} with ${levelPoints} points.`);
}

export const dAdmin: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin Commands')
    // .addSubcommand(subcommand => subcommand
    //   .setName('restart')
    //   .setDescription('Restart the bot'))
    .addSubcommand(subcommand => subcommand
      .setName('rebuild')
      .setDescription('Rebuild the bot'))
    .addSubcommand(subcommand => subcommand
      .setName('deploy')
      .setDescription('Deploy commands'))
    .addSubcommand(subcommand => subcommand
      .setName('setstatus')
      .setDescription('Set the bot\'s status')
      .addStringOption(option => option
        .setName('prefix')
        .setDescription('The prefix')
        .addChoices(
          { name: 'Playing', value: 'playing' },
          { name: 'Listening', value: 'listening' },
          { name: 'Watching', value: 'watching' },
          { name: 'Competing', value: 'competing' },
        )
        .setRequired(true))
      .addStringOption(option => option
        .setName('status')
        .setDescription('The status text')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('setavatar')
      .setDescription('Set the bot\'s avatar')
      .addStringOption(option => option
        .setName('url')
        .setDescription('The URL of the avatar')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('setbanner')
      .setDescription('Set the bot\'s banner')
      .addStringOption(option => option
        .setName('url')
        .setDescription('The URL of the banner')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('overwriteuserdata')
      .setDescription('Overwrite user data')
      .addUserOption(option => option.setName('user').setDescription('The user to update').setRequired(true))
      .addStringOption(option => option.setName('category')
        .setDescription('The category to update')
        .setRequired(true)
        .addChoices(
          { name: 'General', value: 'GENERAL' },
          { name: 'Tripsitter', value: 'TRIPSITTER' },
          { name: 'Developer', value: 'DEVELOPER' },
          { name: 'Team', value: 'TEAM' },
          { name: 'Ignored', value: 'IGNORED' },
          // Add more categories as needed
        ))
      .addStringOption(option => option.setName('type')
        .setDescription('The type to update')
        .setRequired(true)
        .addChoices(
          { name: 'Text', value: 'TEXT' },
          { name: 'Voice', value: 'VOICE' },
          // Add more types as needed
        ))
      .addIntegerOption(option => option.setName('level').setDescription('The level to set').setRequired(true))),

  async execute(interaction) {
    if (!interaction.channel) return false;
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    const command = interaction.options.getSubcommand() as 'restart' | 'rebuild' | 'deploy' | 'setstatus' | 'setavatar' | 'setbanner' | 'overwriteuserdata';
    // By default we want to make the reply private
    await interaction.deferReply({ ephemeral: true });
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (command) {
      case 'restart': {
        await restart(interaction);
        break;
      }
      case 'rebuild': {
        await rebuild(interaction);
        break;
      }
      case 'deploy': {
        await deploy(interaction);
        break;
      }
      case 'setavatar': {
        await setAvatar(interaction, interaction.options.getString('url') as string);
        break;
      }
      case 'setbanner': {
        await setBanner(interaction, interaction.options.getString('url') as string);
        break;
      }
      case 'setstatus': {
        await setStatus(interaction, interaction.options.getString('prefix') as string, interaction.options.getString('status') as string);
        break;
      }
      case 'overwriteuserdata': {
        await overwriteUserData(interaction);
        break;
      }
      default: {
        log.debug(F, `default ${command}`);
        await interaction.editReply('Command not found');
      }
    }
    return true;
  },
};

export default dAdmin;
