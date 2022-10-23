import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
  GuildMember,
  TextChannel,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {moderate} from '../../../global/commands/g.moderate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;


export const report: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addStringOption((option) => option
      .setDescription('User to report!')
      .setRequired(true)
      .setName('target'))
    .addStringOption((option) => option
      .setDescription('Where are they?')
      .setRequired(true)
      .setName('channel'))
    .addStringOption((option) => option
      .setDescription('What are they doing?')
      .setRequired(true)
      .setName('reason')),

  async execute(interaction: ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] started!`);
    await interaction.deferReply({ephemeral: true});
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setDescription('Reporting...');
    await interaction.editReply({embeds: [embed]});

    const actor = interaction.member as GuildMember;
    const command = 'report';
    const target = interaction.options.getString('target')!;
    const channel = interaction.options.getString('channel');
    const toggle = undefined;
    const reason = `${interaction.options.getString('reason')}`;
    const duration = undefined;

    logger.debug(`[${PREFIX}] target: ${target}`);

    const targetMember = interaction.guild!.members.cache.find((member) => member.user.tag === target) as GuildMember;

    logger.debug(`[${PREFIX}] channel: ${channel}`);
    const targetGuild = await interaction!.client.guilds.fetch(env.DISCORD_GUILD_ID);
    const targetChannel = await targetGuild.channels.fetch((channel as string).slice(2, -1)) as TextChannel;

    const result = await moderate(actor!, command, targetMember, targetChannel, toggle, reason, duration, interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.editReply({embeds: [embed]});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
