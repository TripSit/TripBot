/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import { experience_category, experience_type } from '@db/tripbot';
import Canvas from '@napi-rs/canvas';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
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

const COLORS = {
  bg: '#0c0c0c',
  rowOdd: '#1e1e1e',
  rowEven: '#161616',
  rowFocus: '#2b2b2b',
  focusBorder: '#e5e5e5',
  divider: '#4a4a4a',
  title: '#ffffff',
  name: '#ededed',
  rank: '#b0b0b0',
  level: '#8f8f8f',
  levelFocus: '#dcdcdc',
  pageInfo: '#8a8a8a',
};

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

    const PAGE_SIZE = 12;
    const ROWS_PER_COL = 6;
    const totalPages = Math.max(1, Math.ceil(allValidEntries.length / PAGE_SIZE));

    let page = 0;
    if (focusMember) {
      const focusRankIndex = allValidEntries.findIndex(
        e => e.member.id === focusMember.id,
      );
      if (focusRankIndex !== -1) {
        page = Math.floor(focusRankIndex / PAGE_SIZE);
      }
    }

    const PAD = 16;
    const ROW_H = 42;
    const ROW_GAP = 6;
    const ROW_PITCH = ROW_H + ROW_GAP;
    const ROWS_TOP = 56;
    const COL_BOX_W = 460;
    const COL_GAP = 18;
    const CANVAS_W = PAD + COL_BOX_W + COL_GAP + COL_BOX_W + PAD;
    const AVATAR_R = 16;

    const date = new Date();
    const formattedDate = date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      })
      .replace(/ /g, '-');
    const titleText = categoryName.toUpperCase();

    const drawEntry = async (
      ctx: Canvas.SKRSContext2D,
      canvasObj: Canvas.Canvas,
      entry: ValidEntry,
      colX: number,
      rowY: number,
      isFocused: boolean,
    ) => {
      const { user, member, rank } = entry;
      const rowCenterY = rowY + ROW_H / 2;
      const rankRight = colX + 48;
      const avatarCx = colX + 70;
      const contentX = colX + 96;
      const levelX = colX + COL_BOX_W - 10;

      let rowBg = rank % 2 === 1 ? COLORS.rowOdd : COLORS.rowEven;
      if (isFocused) rowBg = COLORS.rowFocus;
      ctx.fillStyle = rowBg;
      ctx.beginPath();
      ctx.roundRect(colX, rowY, COL_BOX_W, ROW_H, [12]);
      ctx.fill();

      if (isFocused) {
        ctx.strokeStyle = COLORS.focusBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(
          colX - 0.75,
          rowY - 0.75,
          COL_BOX_W + 1.5,
          ROW_H + 1.5,
          [12.75],
        );
        ctx.stroke();
      }

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
          ctx.roundRect(colX, rowY, COL_BOX_W, ROW_H, [12]);
          ctx.clip();
          ctx.drawImage(bg, colX, rowY, COL_BOX_W, COL_BOX_W);
          ctx.restore();
        }
      }

      const rankFontSize = rank <= 3 ? 20 : rank >= 10 ? 14 : 16; // eslint-disable-line no-nested-ternary
      ctx.fillStyle = COLORS.rank;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.font = `${rankFontSize}px futura`;
      ctx.fillText(`#${rank}`, rankRight, rowCenterY);

      const avatar = await Canvas.loadImage(
        member.displayAvatarURL({ extension: 'png', size: 64 }),
      );
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCx, rowCenterY, AVATAR_R, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        avatar,
        avatarCx - AVATAR_R,
        rowCenterY - AVATAR_R,
        AVATAR_R * 2,
        AVATAR_R * 2,
      );
      ctx.restore();

      const userLevel = await getTotalLevel(user.total_points);
      const levelText = `LV ${userLevel.level}`;
      ctx.font = '14px futura';
      ctx.fillStyle = isFocused ? COLORS.levelFocus : COLORS.level;
      ctx.textAlign = 'right';
      ctx.fillText(levelText, levelX, rowCenterY);
      const levelTextWidth = ctx.measureText(levelText).width;

      const userNameColor = member.displayColor ? member.displayHexColor : COLORS.name;
      const userName = deFuckifyText(member.displayName || '');
      const userFontSize = rank <= 3 ? 17 : 14;
      const maxNameWidth = levelX - levelTextWidth - 12 - contentX;
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
      ctx.fillText(userName, contentX, rowCenterY);
    };

    const renderPage = async (pageIndex: number): Promise<AttachmentBuilder> => {
      const pageEntries = allValidEntries.slice(
        pageIndex * PAGE_SIZE,
        pageIndex * PAGE_SIZE + PAGE_SIZE,
      );
      const rowsUsed = Math.min(pageEntries.length, ROWS_PER_COL) || 1;
      const canvasHeight = pageEntries.length === 0
        ? 200
        : ROWS_TOP + rowsUsed * ROW_PITCH - ROW_GAP + PAD;

      const canvasObj = Canvas.createCanvas(CANVAS_W, canvasHeight);
      const ctx = canvasObj.getContext('2d');

      ctx.fillStyle = COLORS.bg;
      ctx.beginPath();
      ctx.roundRect(0, 0, CANVAS_W, canvasHeight, [16]);
      ctx.fill();

      ctx.fillStyle = COLORS.title;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = resizeText(
        canvasObj,
        titleText,
        18,
        'futura',
        CANVAS_W - 2 * PAD - 160,
      );
      ctx.fillText(titleText, CANVAS_W / 2, 22);

      const titleWidth = ctx.measureText(titleText).width;
      ctx.fillStyle = COLORS.divider;
      ctx.beginPath();
      ctx.roundRect((CANVAS_W - titleWidth) / 2, 36, titleWidth, 2, [1]);
      ctx.fill();

      if (totalPages > 1) {
        ctx.fillStyle = COLORS.pageInfo;
        ctx.textAlign = 'right';
        ctx.font = '12px futura';
        ctx.fillText(`${pageIndex + 1} / ${totalPages}`, CANVAS_W - PAD, 22);
      }

      for (let i = 0; i < pageEntries.length; i += 1) {
        const entry = pageEntries[i];
        const isLeftColumn = i < ROWS_PER_COL;
        const colX = isLeftColumn ? PAD : PAD + COL_BOX_W + COL_GAP;
        const rowIndex = isLeftColumn ? i : i - ROWS_PER_COL;
        const rowY = ROWS_TOP + rowIndex * ROW_PITCH;
        const isFocused = focusMember ? entry.member.id === focusMember.id : false;
        await drawEntry(ctx, canvasObj, entry, colX, rowY, isFocused); // eslint-disable-line no-await-in-loop
      }

      return new AttachmentBuilder(await canvasObj.encode('png'), {
        name: `TS_Leaderboard_${categoryName}_${formattedDate}.png`,
      });
    };

    const buildRow = (current: number) => new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('leaderboardBack')
        .setLabel('Back')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(current === 0),
      new ButtonBuilder()
        .setCustomId('leaderboardNext')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(current === totalPages - 1),
    );

    const attachment = await renderPage(page);
    const message = await interaction.editReply({
      files: [attachment],
      components: totalPages > 1 ? [buildRow(page)] : [],
    });

    if (totalPages > 1) {
      const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id
          && (i.customId === 'leaderboardBack' || i.customId === 'leaderboardNext'),
        componentType: ComponentType.Button,
        time: 120000,
      });

      collector.on('collect', async (i: ButtonInteraction) => {
        await i.deferUpdate();
        if (i.customId === 'leaderboardNext') {
          page = Math.min(page + 1, totalPages - 1);
        } else {
          page = Math.max(page - 1, 0);
        }
        const pageAttachment = await renderPage(page);
        await interaction.editReply({
          files: [pageAttachment],
          components: [buildRow(page)],
        });
      });

      collector.on('end', async () => {
        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...buildRow(page).components.map(button => button.setDisabled(true)),
        );
        await interaction.editReply({ components: [disabledRow] }).catch(() => {});
      });
    }

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLeaderboard;
