import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { deploy } from '../../utils/commandDeploy';

const F = f(__filename);

export const dAdmin: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin commands'),
  // .addSubcommand(subcommand => subcommand
  //   .setName('restart')
  //   .setDescription('Restart the bot'))
  // .addSubcommand(subcommand => subcommand
  //   .setName('deploy')
  //   .setDescription('Deploy commands')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    // const command = interaction.options.getSubcommand() as 'restart' | 'deploy';
    // await interaction.deferReply({ ephemeral: true });

    await deploy();
    // switch (command) {
    //   case 'restart':
    //     await interaction.editReply({
    //       content: 'Restarting...',
    //     });
    //     process.exit(1);
    //     break;
    //   case 'deploy':
    //     await interaction.editReply({
    //       content: 'Deploying commands...',
    //     });
    //     await deploy();
    //     await interaction.editReply({
    //       content: 'Commands deployed!',
    //     });
    //     break;
    //   default:
    //     break;
    // }
    return true;
  },
};

export default dAdmin;
