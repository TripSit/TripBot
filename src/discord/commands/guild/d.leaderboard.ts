/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import { experience_type } from '@db/tripbot';
import Canvas from '@napi-rs/canvas';
import {
  AttachmentBuilder,
  Guild,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { leaderboardV2 } from '../../../global/commands/g.leaderboard';
import { getLevelFreezes } from '../../../global/commands/g.levelFreeze';
import { getTotalLevel } from '../../../global/utils/experience';
import { SlashCommand } from '../../@types/commandDef';
import {
  deFuckifyText,
  resizeText,
} from '../../utils/canvasUtils';
import commandContext from '../../utils/context';
import getAsset from '../../utils/getAsset';
import { runPager } from '../../utils/pager';

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
  avatarFallback: '#3a3a3a',
};

type Ctx = Canvas.SKRSContext2D;
type Equipped = { font?: string; background?: string };
type CategoryRow = { discord_id: string; total_points: number };
type ValidEntry = {
  user: CategoryRow;
  member: GuildMember;
  rank: number;
};

const PAGE_SIZE = 12;
const ROWS_PER_COL = 6;
const PAD = 16;
const ROW_H = 42;
const ROW_GAP = 6;
const ROW_PITCH = ROW_H + ROW_GAP;
const ROWS_TOP = 56;
const COL_BOX_W = 460;
const COL_GAP = 18;
const CANVAS_W = PAD + COL_BOX_W + COL_GAP + COL_BOX_W + PAD;
const AVATAR_R = 16;

/** Everything needed to draw the pages of one leaderboard. */
type BoardContext = {
  entries: ValidEntry[];
  equippedByDiscordId: Map<string, Equipped>;
  frozenLevels: Map<string, number | null | undefined>;
  focusMemberId: string | undefined;
  titleText: string;
  attachmentName: string;
  totalPages: number;
};

// Pull the members of the candidate users into the guild cache, falling back to one-by-one fetches
async function cacheMembers(guild: Guild, candidateIds: string[]): Promise<void> {
  if (candidateIds.length === 0) return;
  await guild.members
    .fetch({ user: candidateIds })
    .catch(async () => {
      log.debug(F, 'Bulk member fetch failed, falling back to individual fetches');
      await Promise.all(
        candidateIds.map(id => guild.members.fetch(id).catch(() => null)),
      );
      return null;
    });
}

// Build a ranked list — rank is position among guild members, not DB rows
function rankGuildMembers(guild: Guild, rows: CategoryRow[]): ValidEntry[] {
  const entries: ValidEntry[] = [];
  for (const user of rows) {
    const member = guild.members.cache.get(user.discord_id);
    if (member) {
      entries.push({
        user,
        member,
        rank: entries.length + 1,
      });
    }
  }
  return entries;
}

async function loadEquippedItems(rankedIds: string[]): Promise<Map<string, Equipped>> {
  const equippedByDiscordId = new Map<string, Equipped>();
  const personaRows = await db.users.findMany({
    where: { discord_id: { in: rankedIds } },
    select: {
      discord_id: true,
      personas: {
        select: {
          rpg_inventory: {
            where: { equipped: true, effect: { in: ['font', 'background'] } },
            select: { effect: true, value: true },
          },
        },
      },
    },
  });
  for (const row of personaRows) {
    if (!row.discord_id || !row.personas) continue;
    const equipped: Equipped = {};
    for (const item of row.personas.rpg_inventory) {
      if (item.effect === 'font') equipped.font = item.value;
      if (item.effect === 'background') equipped.background = item.value;
    }
    equippedByDiscordId.set(row.discord_id, equipped);
  }
  return equippedByDiscordId;
}

function drawRowBackground(ctx: Ctx, colX: number, rowY: number, rank: number, isFocused: boolean): void {
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
}

/** Draws the user's equipped background (if it loads) and returns the font to use for their name. */
async function drawEquippedStyle(ctx: Ctx, equipped: Equipped | undefined, colX: number, rowY: number): Promise<string> {
  let userFont = 'futura';
  if (equipped?.font) {
    try {
      await getAsset(equipped.font);
      userFont = equipped.font;
    } catch (error) {
      log.debug(F, `Failed to load font ${equipped.font}: ${error}`);
    }
  }
  if (equipped?.background) {
    let bg = null;
    try {
      bg = await Canvas.loadImage(await getAsset(equipped.background));
    } catch (error) {
      log.debug(F, `Failed to load background ${equipped.background}: ${error}`);
    }
    if (bg) {
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
  return userFont;
}

function drawRankAndAvatar(
  ctx: Ctx,
  rank: number,
  position: { colX: number; rowCenterY: number },
  avatar: Canvas.Image | null,
): void {
  const { colX, rowCenterY } = position;
  const rankRight = colX + 48;
  const avatarCx = colX + 70;

  let rankFontSize = 16;
  if (rank <= 3) rankFontSize = 20;
  else if (rank >= 10) rankFontSize = 14;
  ctx.fillStyle = COLORS.rank;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.font = `${rankFontSize}px futura`;
  ctx.fillText(`#${rank}`, rankRight, rowCenterY);

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCx, rowCenterY, AVATAR_R, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  if (avatar) {
    ctx.drawImage(
      avatar,
      avatarCx - AVATAR_R,
      rowCenterY - AVATAR_R,
      AVATAR_R * 2,
      AVATAR_R * 2,
    );
  } else {
    ctx.fillStyle = COLORS.avatarFallback;
    ctx.fillRect(avatarCx - AVATAR_R, rowCenterY - AVATAR_R, AVATAR_R * 2, AVATAR_R * 2);
  }
  ctx.restore();
}

async function drawNameAndLevel(
  ctx: Ctx,
  canvasObj: Canvas.Canvas,
  entry: ValidEntry,
  style: { colX: number; rowCenterY: number; userFont: string; isFocused: boolean; frozenLevel: number | null | undefined },
): Promise<void> {
  const { user, member, rank } = entry;
  const {
    colX, rowCenterY, userFont, isFocused,
  } = style;
  const contentX = colX + 96;
  const levelX = colX + COL_BOX_W - 10;

  const userLevel = await getTotalLevel(user.total_points, style.frozenLevel);
  const levelText = `LV ${userLevel.level}`;
  ctx.font = '14px futura';
  ctx.fillStyle = isFocused ? COLORS.levelFocus : COLORS.level;
  ctx.textAlign = 'right';
  ctx.fillText(levelText, levelX, rowCenterY);
  const levelTextWidth = ctx.measureText(levelText).width;

  const userNameColor = member.displayColor ? member.displayHexColor : COLORS.name;
  const userName = deFuckifyText(member.displayName);
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
}

async function drawEntry(
  board: BoardContext,
  ctx: Ctx,
  canvasObj: Canvas.Canvas,
  entry: ValidEntry,
  position: { colX: number; rowY: number },
  avatar: Canvas.Image | null,
): Promise<void> {
  const { colX, rowY } = position;
  const rowCenterY = rowY + ROW_H / 2;
  const isFocused = board.focusMemberId ? entry.member.id === board.focusMemberId : false;

  drawRowBackground(ctx, colX, rowY, entry.rank, isFocused);
  const userFont = await drawEquippedStyle(ctx, board.equippedByDiscordId.get(entry.user.discord_id), colX, rowY);
  drawRankAndAvatar(ctx, entry.rank, { colX, rowCenterY }, avatar);
  await drawNameAndLevel(ctx, canvasObj, entry, {
    colX,
    rowCenterY,
    userFont,
    isFocused,
    frozenLevel: board.frozenLevels.get(entry.user.discord_id),
  });
}

function drawBoardHeader(ctx: Ctx, canvasObj: Canvas.Canvas, board: BoardContext, pageIndex: number, canvasHeight: number): void {
  ctx.fillStyle = COLORS.bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, CANVAS_W, canvasHeight, [16]);
  ctx.fill();

  ctx.fillStyle = COLORS.title;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = resizeText(
    canvasObj,
    board.titleText,
    18,
    'futura',
    CANVAS_W - 2 * PAD - 160,
  );
  ctx.fillText(board.titleText, CANVAS_W / 2, 22);

  const titleWidth = ctx.measureText(board.titleText).width;
  ctx.fillStyle = COLORS.divider;
  ctx.beginPath();
  ctx.roundRect((CANVAS_W - titleWidth) / 2, 36, titleWidth, 2, [1]);
  ctx.fill();

  if (board.totalPages > 1) {
    ctx.fillStyle = COLORS.pageInfo;
    ctx.textAlign = 'right';
    ctx.font = '12px futura';
    ctx.fillText(`${pageIndex + 1} / ${board.totalPages}`, CANVAS_W - PAD, 22);
  }
}

async function renderBoardPage(board: BoardContext, pageIndex: number): Promise<Buffer> {
  const pageEntries = board.entries.slice(
    pageIndex * PAGE_SIZE,
    pageIndex * PAGE_SIZE + PAGE_SIZE,
  );
  const rowsUsed = Math.min(pageEntries.length, ROWS_PER_COL) || 1;
  const canvasHeight = pageEntries.length === 0
    ? 200
    : ROWS_TOP + rowsUsed * ROW_PITCH - ROW_GAP + PAD;

  const canvasObj = Canvas.createCanvas(CANVAS_W, canvasHeight);
  const ctx = canvasObj.getContext('2d');
  drawBoardHeader(ctx, canvasObj, board, pageIndex, canvasHeight);

  const avatars = await Promise.all(pageEntries.map(entry => Canvas.loadImage(
    entry.member.displayAvatarURL({ extension: 'png', size: 64, forceStatic: true }),
  ).catch(error => {
    log.debug(F, `Failed to load avatar for ${entry.member.id}: ${error}`);
    return null;
  })));

  for (let i = 0; i < pageEntries.length; i += 1) {
    const isLeftColumn = i < ROWS_PER_COL;
    const colX = isLeftColumn ? PAD : PAD + COL_BOX_W + COL_GAP;
    const rowIndex = isLeftColumn ? i : i - ROWS_PER_COL;
    const rowY = ROWS_TOP + rowIndex * ROW_PITCH;
    await drawEntry(board, ctx, canvasObj, pageEntries[i], { colX, rowY }, avatars[i]);
  }

  return canvasObj.encode('png');
}

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
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const startTime = Date.now();
    const { guild } = interaction;
    if (!guild) {
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
    const categoryName = categoryChoices.find(c => c.value === categoryChoice)?.name
      ?? 'Total Level';

    const focusTarget = interaction.options.getUser('user');
    const focusMember = focusTarget
      ? (guild.members.cache.get(focusTarget.id)
        ?? (await guild.members
          .fetch(focusTarget.id)
          .catch(() => null)))
      : null;

    const leaderboardData = await leaderboardV2(typeChoice, categoryChoice);
    const typeData = leaderboardData[typeChoice.toUpperCase() as keyof typeof leaderboardData];
    const categoryData = typeData
      ? (typeData[categoryChoice.toUpperCase() as keyof typeof typeData] ?? [])
      : [];

    // Pull more entries from Discord when a focus user is specified so we can
    // find them further down the leaderboard. 2× the normal limit as a buffer
    // for users who have left the server.
    const fetchLimit = focusMember ? 100 : 50;
    const candidateRows = categoryData.slice(0, fetchLimit);
    await cacheMembers(guild, candidateRows.map(u => u.discord_id).filter(Boolean));

    const allValidEntries = rankGuildMembers(guild, candidateRows);
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

    const rankedIds = allValidEntries.map(entry => entry.user.discord_id);
    const frozenLevels = await getLevelFreezes(rankedIds);
    const equippedByDiscordId = await loadEquippedItems(rankedIds);

    const formattedDate = new Date()
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      })
      .replace(/ /g, '-');
    const board: BoardContext = {
      entries: allValidEntries,
      equippedByDiscordId,
      frozenLevels,
      focusMemberId: focusMember?.id,
      titleText: categoryName.toUpperCase(),
      attachmentName: `TS_Leaderboard_${categoryName}_${formattedDate}.png`,
      totalPages,
    };

    const pageCache = new Map<number, Buffer>();
    const renderPage = async (pageIndex: number): Promise<AttachmentBuilder> => {
      let encoded = pageCache.get(pageIndex);
      if (!encoded) {
        encoded = await renderBoardPage(board, pageIndex);
        pageCache.set(pageIndex, encoded);
      }
      return new AttachmentBuilder(encoded, { name: board.attachmentName });
    };

    await runPager(interaction, {
      pageCount: totalPages,
      idPrefix: 'leaderboard',
      showControls: totalPages > 1,
      startIndex: page,
      renderPage: async index => ({ files: [await renderPage(index)] }),
    });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLeaderboard;
