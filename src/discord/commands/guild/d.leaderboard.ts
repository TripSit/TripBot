/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import { experience_category, experience_type } from '@db/tripbot';
import Canvas from '@napi-rs/canvas';
import {
  AttachmentBuilder,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { leaderboardV2 } from '../../../global/commands/g.leaderboard';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { getTotalLevel } from '../../../global/utils/experience';
import { SlashCommand } from '../../@types/commandDef';
import {
  deFuckifyText,
  generateColors,
  resizeText,
} from '../../utils/canvasUtils';
import commandContext from '../../utils/context';
import getAsset from '../../utils/getAsset';

const F = f(__filename);

const categoryChoices = [
  { name: 'Total Level', value: 'TOTAL' },
  { name: 'Chat Level', value: 'GENERAL' },
  { name: 'Voice Level', value: 'VOICE' },
  { name: 'Harm Reduction Level', value: 'TRIPSITTER' },
  { name: 'Development Level', value: 'DEVELOPER' },
  { name: 'Team Tripsit Level', value: 'TEAM' },
];

const RANK_COLORS = ['#FFD700', '#a8a9ad', '#aa7042'];

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setName('category')
      .setDescription('What category of experience?')
      .addChoices(
        { name: 'Total (Default)', value: 'TOTAL' },
        { name: 'Chat', value: 'GENERAL' },
        { name: 'Voice', value: 'VOICE' },
        { name: 'Harm Reduction', value: 'TRIPSITTER' },
        { name: 'Development', value: 'DEVELOPER' },
        { name: 'Team Tripsit', value: 'TEAM' },
      ))
    .addUserOption(option => option
      .setName('user')
      .setDescription('Center the leaderboard around this user'))
    .addBooleanOption(option => option
      .setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    // eslint-disable-line
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const startTime = Date.now();
    if (!interaction.guild) {
      await interaction.editReply('You can only use this command in a guild!');
      return false;
    }

    let categoryChoice = (interaction.options.getString('category')
      ?? 'TOTAL') as
      | 'TOTAL'
      | 'GENERAL'
      | 'VOICE'
      | 'TRIPSITTER'
      | 'DEVELOPER'
      | 'TEAM'
      | 'IGNORED';
    let typeChoice = 'ALL' as experience_type;
    if (categoryChoice === 'VOICE') {
      typeChoice = 'VOICE';
      categoryChoice = 'TOTAL';
    }
    categoryChoice = categoryChoice as experience_category;
    const categoryName = categoryChoices.find(c => c.value === categoryChoice)?.name
      || 'Total Level';

    const focusTarget = interaction.options.getUser('user');
    const focusMember = focusTarget
      ? (interaction.guild.members.cache.get(focusTarget.id)
        ?? (await interaction.guild.members
          .fetch(focusTarget.id)
          .catch(() => null)))
      : null;

    const leaderboardData = await leaderboardV2();
    const typeData = leaderboardData[typeChoice.toUpperCase() as keyof typeof leaderboardData];
    const categoryData = typeData
      ? (typeData[categoryChoice.toUpperCase() as keyof typeof typeData] ?? [])
      : [];

    // Pull more entries from Discord when a focus user is specified so we can
    // find them further down the leaderboard. 2× the normal limit as a buffer
    // for users who have left the server.
    const fetchLimit = focusMember ? 100 : 50;
    await Promise.all(
      categoryData
        .slice(0, fetchLimit)
        .map(u => interaction.guild?.members.fetch(u.discord_id).catch(() => null)),
    );

    // Build a ranked list — rank is position among guild members, not DB rows
    type ValidEntry = {
      user: { discord_id: string; total_points: number };
      member: GuildMember;
      rank: number;
    };
    const allValidEntries: ValidEntry[] = [];
    for (const user of categoryData.slice(0, fetchLimit)) {
      const member = interaction.guild.members.cache.get(user.discord_id);
      if (member) {
        allValidEntries.push({
          user,
          member,
          rank: allValidEntries.length + 1,
        });
      }
    }

    const MAX_DISPLAY = 25;
    let displayEntries: ValidEntry[];
    let focusDisplayIndex = -1;

    if (focusMember) {
      const focusRankIndex = allValidEntries.findIndex(
        e => e.member.id === focusMember.id,
      );
      if (focusRankIndex !== -1) {
        const half = Math.floor(MAX_DISPLAY / 2);
        let start = Math.max(0, focusRankIndex - half);
        const end = Math.min(allValidEntries.length, start + MAX_DISPLAY);
        start = Math.max(0, end - MAX_DISPLAY);
        displayEntries = allValidEntries.slice(start, end);
        focusDisplayIndex = focusRankIndex - start;
      } else {
        // User has no experience data; fall back to normal top view
        displayEntries = allValidEntries.slice(0, MAX_DISPLAY);
      }
    } else {
      displayEntries = allValidEntries.slice(0, MAX_DISPLAY);
    }

    const CANVAS_W = 520;
    const PAD = 14;
    const ROW_H = 36;
    const ROW_GAP = 5;
    const ROW_PITCH = ROW_H + ROW_GAP;
    const ROWS_TOP = 50;
    const RANK_RIGHT = 56;
    const AVATAR_CX = 76;
    const AVATAR_R = 14;
    const CONTENT_X = 98;
    const LEVEL_X = 500;

    const entryCount = displayEntries.length;
    const canvasHeight = entryCount === 0
      ? 200
      : ROWS_TOP + entryCount * ROW_PITCH - ROW_GAP + PAD;

    const canvasObj = Canvas.createCanvas(CANVAS_W, canvasHeight);
    const ctx = canvasObj.getContext('2d');

    ctx.fillStyle = '#0c0c0c';
    ctx.beginPath();
    ctx.roundRect(0, 0, CANVAS_W, canvasHeight, [16]);
    ctx.fill();

    const titleText = categoryName.toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = resizeText(
      canvasObj,
      titleText,
      18,
      'futura',
      CANVAS_W - 2 * PAD - 20,
    );
    ctx.fillText(titleText, CANVAS_W / 2, 22);

    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.roundRect((CANVAS_W - titleWidth) / 2, 36, titleWidth, 2, [1]);
    ctx.fill();

    for (let i = 0; i < entryCount; i += 1) {
      const { user, member, rank } = displayEntries[i];
      const isFocused = i === focusDisplayIndex;
      const rowY = ROWS_TOP + i * ROW_PITCH;
      const rowCenterY = rowY + ROW_H / 2;
      const rankColor = RANK_COLORS[rank - 1] ?? '#2dd4bf';

      ctx.fillStyle = isFocused ? '#262626' : '#191919';
      ctx.beginPath();
      ctx.roundRect(PAD, rowY, CANVAS_W - 2 * PAD, ROW_H, [10]);
      ctx.fill();

      if (isFocused) {
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(
          PAD - 0.75,
          rowY - 0.75,
          CANVAS_W - 2 * PAD + 1.5,
          ROW_H + 1.5,
          [10.75],
        );
        ctx.stroke();
      }

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(PAD, rowY, CANVAS_W - 2 * PAD, ROW_H, [10]);
      ctx.clip();
      ctx.fillStyle = rankColor;
      ctx.fillRect(PAD, rowY, 4, ROW_H);
      ctx.restore();

      const personaData = await getPersonaInfo(user.discord_id);
      let userFont = 'futura';
      if (personaData) {
        const inventoryData = await db.rpg_inventory.findMany({
          where: { persona_id: personaData.id },
        });
        const equippedFont = inventoryData.find(
          item => item.equipped === true && item.effect === 'font',
        );
        const equippedBackground = inventoryData.find(
          item => item.equipped === true && item.effect === 'background',
        );
        if (equippedFont) {
          await getAsset(equippedFont.value);
          userFont = equippedFont.value;
        }
        if (equippedBackground) {
          const imagePath = await getAsset(equippedBackground.value);
          const bg = await Canvas.loadImage(imagePath);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.05;
          ctx.beginPath();
          ctx.roundRect(PAD, rowY, CANVAS_W - 2 * PAD, ROW_H, [10]);
          ctx.clip();
          ctx.drawImage(bg, PAD, rowY, CANVAS_W - 2 * PAD, CANVAS_W - 2 * PAD);
          ctx.restore();
        }
      }

      const rankFontSize = rank <= 3 ? 18 : rank >= 10 ? 12 : 14; // eslint-disable-line no-nested-ternary
      ctx.fillStyle = rankColor;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.font = `${rankFontSize}px futura`;
      ctx.fillText(`#${rank}`, RANK_RIGHT, rowCenterY);

      const avatar = await Canvas.loadImage(
        member.displayAvatarURL({ extension: 'png', size: 64 }),
      );
      ctx.save();
      ctx.beginPath();
      ctx.arc(AVATAR_CX, rowCenterY, AVATAR_R, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        avatar,
        AVATAR_CX - AVATAR_R,
        rowCenterY - AVATAR_R,
        AVATAR_R * 2,
        AVATAR_R * 2,
      );
      ctx.restore();

      const userLevel = await getTotalLevel(user.total_points, user.discord_id);
      const levelText = `LV ${userLevel.level}`;
      ctx.font = '12px futura';
      ctx.fillStyle = isFocused ? '#94a3b8' : '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(levelText, LEVEL_X, rowCenterY);
      const levelTextWidth = ctx.measureText(levelText).width;

      const roleColor = `#${(member.roles.color?.color || 0x99aab5).toString(16).padStart(6, '0')}`;
      const userNameColor = generateColors(roleColor, 0, 0, 0);
      const userName = deFuckifyText(member.displayName || '');
      const userFontSize = rank <= 3 ? 16 : 13;
      const maxNameWidth = LEVEL_X - levelTextWidth - 12 - CONTENT_X;
      ctx.font = `${userFontSize}px ${userFont}`;
      ctx.fillStyle = userNameColor;
      ctx.font = resizeText(
        canvasObj,
        userName,
        userFontSize,
        userFont,
        maxNameWidth,
      );
      ctx.textAlign = 'left';
      ctx.fillText(userName, CONTENT_X, rowCenterY);
    }

    const date = new Date();
    const formattedDate = date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      })
      .replace(/ /g, '-');
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), {
      name: `TS_Leaderboard_${categoryName}_${formattedDate}.png`,
    });
    await interaction.editReply({ files: [attachment] });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLeaderboard;
