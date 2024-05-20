/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
  AttachmentBuilder,
} from 'discord.js';
import Canvas from '@napi-rs/canvas';
import { personas } from '@prisma/client';
import { SlashCommand } from '../../@types/commandDef';
import { profile, ProfileData } from '../../../global/commands/g.profile';
import commandContext from '../../utils/context';
import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import getAsset from '../../utils/getAsset';
import { resizeText, deFuckifyText, colorDefs } from '../../utils/canvasUtils';

const F = f(__filename);

export const dNYT: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('nyt')
    .setDescription('Get someone\'s NYT Games stats')
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to lookup'))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(
    interaction,
  ) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    if (!interaction.guild) {
      await interaction.editReply({ content: 'You can only use this command in a guild!' });
      return false;
    }

    // Target is the option given, if none is given, it will be the user who used the command
    const target = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;

    // Fetch the wordle_stats for the target user
    const user = await db.users.findFirst({
      where: {
        discord_id: target.id,
      },
    });
    if (!user) {
      await interaction.followUp('User not found in the database');
      return false;
    }
    const wordleStats = await db.wordle_stats.findFirst({
      where: {
        user_id: user.id,
      },
    });

    // Send a message with the target user's stats
    await interaction.followUp(`User: ${target.user.username}, Win Rate: ${Math.round((wordleStats?.win_rate ?? 0) * 100)}%, Games Played: ${wordleStats?.games_played}, Current Streak: ${wordleStats?.current_streak}, Best Streak: ${wordleStats?.best_streak}`);
    return true;
  },
};

export default dNYT;
