import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import axios from 'axios';
import { stripIndents } from 'common-tags';
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
      .setDescription('Deploy commands')),
  async execute(interaction) {
    if (!interaction.channel) return false;
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    const command = interaction.options.getSubcommand() as 'restart' | 'rebuild' | 'deploy';
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
      default: {
        log.debug(F, `default ${command}`);
        await interaction.editReply('Command not found');
      }
    }
    return true;
  },
};

export default dAdmin;
