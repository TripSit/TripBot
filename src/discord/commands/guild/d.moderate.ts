import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
  GuildMember,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {moderate} from '../../../global/commands/g.moderate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const mod: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('mod')
      .setDescription('Moderation actions!')
      .addSubcommand((subcommand) => subcommand
          .setDescription('Info on a user')
          .addStringOption((option) => option
              .setName('target')
              .setDescription('User to get info on!')
              .setRequired(true))
          .setName('info'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('Warn a user')
          .addStringOption((option) => option
              .setName('target')
              .setDescription('User to warn!')
              .setRequired(true))
          .addStringOption((option) => option
              .setName('reason')
              .setDescription('VISIBLE TO USER: Reason for warn!')
              .setRequired(true))
          .setName('warn'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('Create a note about a user')
          .addStringOption((option) => option
              .setName('target')
              .setDescription('User to note about!')
              .setRequired(true))
          .addStringOption((option) => option
              .setName('reason')
              .setDescription('Reason for note!')
              .setRequired(true))
          .setName('note'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('Timeout a user')
          .addStringOption((option) => option
              .setName('target')
              .setDescription('User to timeout!')
              .setRequired(true))
          .addStringOption((option) => option
              .setName('reason')
              .setDescription('VISIBLE TO USER: Reason for timeout!')
              .setRequired(true))
          .addStringOption((option) => option
              .setName('toggle')
              .setDescription('On off?')
              .addChoices(
                  {name: 'On', value: 'on'},
                  {name: 'Off', value: 'off'},
              ))
          .addStringOption((option) => option
              .setName('duration')
              .setDescription('Duration of ban!'))
          .setName('timeout'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('Kick a user')
          .addStringOption((option) => option
              .setName('target')
              .setDescription('User to kick!')
              .setRequired(true))
          .addStringOption((option) => option
              .setName('reason')
              .setDescription('Reason for kick!')
              .setRequired(true))
          .addStringOption((option) => option
              .setName('channel')
              .setDescription('Channel to kick from!'))
          .setName('kick')),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] started!`);
    await interaction.deferReply({ephemeral: true});
    const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription('Moderating...');
    await interaction.editReply({embeds: [embed]});

    const actor = interaction.member;
    const command = interaction.options.getSubcommand();
    const target = interaction.options.getString('target');
    const toggle = interaction.options.getString('toggle') || 'on';
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const duration = interaction.options.getString('duration') || undefined;
    const channel = interaction.options.getString('channel');

    const result = await moderate(
        actor as GuildMember,
        command,
        target!,
        channel,
        toggle,
        reason,
        duration,
        interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.editReply({embeds: [embed]});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
