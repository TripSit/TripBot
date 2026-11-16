import Canvas from '@napi-rs/canvas';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  // UserContextMenuCommandInteraction,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { levels } from '../../../global/commands/g.levels';
import { profile } from '../../../global/commands/g.profile';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import getAsset from '../../utils/getAsset';
import { numFormatter, numFormatterVoice } from './d.profile';

import { generateColors } from '../../utils/canvasUtils';
import {
  Ctx, cardDisplayName, drawAvatar, drawPurchasedExtras, drawUsername, getAvatarIcons, levelBadgeName,
} from '../../utils/cardHelpers';

const F = f(__filename);

const fontSizeFamily = '25px futura';

const levelCalculatorUrl = 'https://tripsit.me/levels';

type LevelData = Awaited<ReturnType<typeof levels>>;
type ProfileData = Awaited<ReturnType<typeof profile>>;

type XpBar = {
  image: Canvas.Image;
  dataName: string;
  progress: number;
  level: number;
  rank: number;
};

// Layout height by the number of extra xp bars (0 to 4)
const LAYOUT_HEIGHTS = [326, 395, 446, 506, 566];

// Y offsets of the (up to four) extra xp bars, relative to the first of them
const barTop = (slotIndex: number) => 317 + slotIndex * 60;

const ratio = (part: number, whole: number): number => part / whole;

function getXpBars(
  target: GuildMember | null,
  levelData: LevelData,
  bars: { voiceBar: Canvas.Image; tripsitterBar: Canvas.Image; developerBar: Canvas.Image; teamtripsitBar: Canvas.Image },
): XpBar[] {
  const xpBarList: XpBar[] = [];
  const textBar = (image: Canvas.Image, dataName: string, data: LevelData['TEXT'][keyof LevelData['TEXT']]): XpBar => ({
    image,
    dataName,
    progress: data ? ratio(data.level_exp, data.nextLevel) : 0,
    level: data ? data.level : 0,
    rank: data ? data.rank : 0,
  });

  // Check if user has voice xp, if so add it to the list to be assigned a xp bar slot
  if (levelData.VOICE.TOTAL.level) {
    xpBarList.push({
      image: bars.voiceBar,
      dataName: 'Voice',
      progress: ratio(levelData.VOICE.TOTAL.level_exp, levelData.VOICE.TOTAL.nextLevel),
      level: levelData.VOICE.TOTAL.level,
      rank: levelData.VOICE.TOTAL.rank,
    });
  }
  // Check if user has Helper or Tripsitter role (only if they're in the guild)
  if (target && (target.roles.cache.has(env.ROLE_HELPER) || target.roles.cache.has(env.ROLE_TRIPSITTER))) {
    xpBarList.push(textBar(bars.tripsitterBar, 'Tripsitter', levelData.TEXT.TRIPSITTER));
  }
  // Check if user has Dev role or has some xp (shows even if not in guild if they have level > 5)
  if ((levelData.TEXT.DEVELOPER && levelData.TEXT.DEVELOPER.level > 5) || (target?.roles.cache.has(env.ROLE_DEVELOPER))) {
    xpBarList.push(textBar(bars.developerBar, 'Developer', levelData.TEXT.DEVELOPER));
  }
  // Check if user has Teamtripsit role (only if they're in the guild)
  if (target?.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
    xpBarList.push(textBar(bars.teamtripsitBar, 'Team', levelData.TEXT.TEAM));
  }
  return xpBarList;
}

function drawCardShape(context: Ctx, colors: { light: string; dark: string }, layoutHeight: number): void {
  context.fillStyle = colors.light;
  context.beginPath();
  context.roundRect(20, 0, 901, 145, [19]);
  context.roundRect(20, 154, 901, (layoutHeight - 154), [19]);
  context.fill();
  context.fillStyle = colors.dark;
  context.beginPath();
  context.roundRect(0, 0, 684, 145, [19]);
  context.roundRect(0, 154, 684, (layoutHeight - 154), [19]);
  context.fill();
}

function drawChips(context: Ctx, chipColor: string, layoutHeight: number, barCount: number): void {
  // Top Right Chips
  context.fillStyle = chipColor;
  context.beginPath();
  context.roundRect(702, 18, 201, 51, [19]);
  context.roundRect(702, 78, 201, 51, [19]);
  // Label Chips
  context.roundRect(18, 172, 51, (layoutHeight - 190), [19]);
  context.roundRect(852, 172, 51, (layoutHeight - 190), [19]);
  // Level Bar and Rank Chips
  context.roundRect(87, 172, 579, 76, [19]);
  context.roundRect(702, 172, 132, 76, [19]);
  context.roundRect(87, 257, 579, 51, [19]);
  context.roundRect(702, 257, 132, 51, [19]);
  for (let slot = 0; slot < barCount; slot += 1) {
    context.roundRect(87, barTop(slot), 579, 51, [19]);
    context.roundRect(702, barTop(slot), 132, 51, [19]);
  }
  context.fill();
}

function drawProgressBars(
  context: Ctx,
  barColor: string,
  progress: { total: number; general: number },
  xpBars: XpBar[],
): void {
  context.fillStyle = barColor;
  context.save();
  context.beginPath();
  context.roundRect(87, 172, 579, 76, [19]);
  context.roundRect(87, 257, 579, 51, [19]);
  for (let slot = 0; slot < 4; slot += 1) {
    context.roundRect(87, barTop(slot), 579, 51, [19]);
  }
  context.clip();
  context.beginPath();
  context.roundRect(87, 172, (progress.total) * 579, 76, [19]);
  context.roundRect(87, 257, (progress.general) * 579, 51, [19]);
  xpBars.forEach((bar, slot) => {
    context.roundRect(87, barTop(slot), (bar.progress) * 579, 51, [19]);
  });
  context.fill();
  context.restore();
}

function drawLevelText(context: Ctx, levelData: LevelData, xpBars: XpBar[]): void {
  context.font = '40px futura';
  context.fillStyle = '#ffffff';
  context.textBaseline = 'middle';
  context.textAlign = 'right';
  context.fillText(`${levelData.ALL.TOTAL.level}`, 657, 213);
  context.font = fontSizeFamily;
  context.fillText(`${levelData.TEXT.GENERAL ? levelData.TEXT.GENERAL.level : 0}`, 657, 284);
  xpBars.forEach((bar, slot) => {
    context.fillText(`${bar.level}`, 657, barTop(slot) + 27);
  });
}

// Fit the rank text into its chip and colour it by rank, returning the font to draw it with
function applyRank(canvas: Canvas.Canvas, text: string, startingFontSize: number): string {
  const rankContext = canvas.getContext('2d');
  let fontSize = startingFontSize;
  do {
    fontSize -= 1;
    rankContext.font = `${fontSize}px futura`;
  } while (rankContext.measureText(text).width > 114);
  // Set the color of the rank text based on the rank
  const rankColors: Record<string, string> = { '#1': '#d4af37', '#2': '#a8a9ad', '#3': '#aa7042' };
  rankContext.fillStyle = rankColors[text] ?? '#ffffff';
  return rankContext.font;
}

function drawRankText(context: Ctx, canvasObj: Canvas.Canvas, levelData: LevelData, xpBars: XpBar[]): void {
  context.textAlign = 'left';
  const totalRank = `#${levelData.ALL.TOTAL.rank}`;
  context.font = applyRank(canvasObj, totalRank, 40);
  context.fillText(totalRank, 711, 213);

  const generalRank = `#${levelData.TEXT.GENERAL ? levelData.TEXT.GENERAL.rank : 0}`;
  context.font = applyRank(canvasObj, generalRank, 25);
  context.fillText(generalRank, 711, 284);

  xpBars.forEach((bar, slot) => {
    const rankText = bar.rank ? `#${bar.rank}` : '#0';
    context.font = applyRank(canvasObj, rankText, 25);
    context.fillText(rankText, 711, barTop(slot) + 27);
  });
}

function drawLabelsAndTotals(
  context: Ctx,
  layoutHeight: number,
  profileData: ProfileData,
): void {
  // Bar Labels
  context.textAlign = 'center';
  context.fillStyle = '#ffffff';
  context.font = fontSizeFamily;
  context.save();
  context.translate(921, 0);
  context.rotate((90 * Math.PI) / 180);
  context.fillText('RANK', ((layoutHeight / 2) + 77), 45);
  context.translate(layoutHeight, 921);
  context.rotate((180 * Math.PI) / 180);
  context.fillText('LEVEL', ((layoutHeight / 2) - 77), 45);
  context.restore();

  // Messages Sent Text
  context.textAlign = 'right';
  if (profileData.totalTextExp) {
    const MessagesSent = profileData.totalTextExp / 20;
    context.fillText(`${numFormatter(MessagesSent)}`, 894, 45);
  } else {
    context.fillText('0', 894, 45);
  }

  // Voice Hours Text
  if (profileData.totalTextExp) {
    const hoursInChat = (profileData.totalVoiceExp / 10 / 60);
    context.fillText(`${numFormatterVoice(hoursInChat)} HR`, 894, 105);
  } else {
    context.fillText('0 HR', 894, 105);
  }
}

function drawIcons(
  context: Ctx,
  icons: Canvas.Image,
  canvasWidth: number,
  xpBars: XpBar[],
): void {
  // Icons sprite has static labels baked in for the Voice/Harm Reduction/Development/Team rows,
  // but those rows are positionally compacted based on which categories a user has, so the
  // baked labels don't line up with whichever bar actually lands there. Each xpBarSlot image
  // already carries its own icon+label, so clip the static ones out to avoid drawing both.
  context.save();
  context.beginPath();
  context.rect(0, 0, canvasWidth, 308);
  context.clip();
  context.drawImage(icons, 0, 0);
  context.restore();
  xpBars.forEach((bar, slot) => {
    context.drawImage(bar.image, 87, barTop(slot), 579, 51);
  });
}

export const dLevels: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Get someone\'s current experience levels!')
    .setIntegrationTypes([0])
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to lookup'))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(
    interaction:ChatInputCommandInteraction,
  ) {
    log.info(F, await commandContext(interaction));
    const startTime = Date.now();
    if (!interaction.guild) {
      await interaction.editReply('You can only use this command in a guild!');
      return false;
    }

    // Target is the option given, if none is given, it will be the user who used the command
    // First try to get as User (works even if not in guild)
    const targetUser = interaction.options.getUser('target') ?? interaction.user;

    // Then try to get as GuildMember (may be null if not in guild)
    let target: GuildMember | null = null;
    try {
      target = await interaction.guild.members.fetch(targetUser.id);
    } catch {
      // User is not in the guild, target will remain null
      log.debug(F, `User ${targetUser.id} is not in the guild`);
    }

    // If target is still null (user not in guild), we'll use fallback values below

    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    const values = [
      await interaction.deferReply({ flags: ephemeral }),
      // Get the target's profile data from the database
      await profile(targetUser.id),
      // Check get fresh persona data
      await getPersonaInfo(targetUser.id),
      // Get the levels of the user
      await levels(targetUser.id),
      // Load Images
      await Canvas.loadImage(await getAsset('cardLevelIcons')),
      await Canvas.loadImage(targetUser.displayAvatarURL({ extension: 'jpg' })),
      await Canvas.loadImage(await getAsset('teamtripsitIcon')),
      await Canvas.loadImage(await getAsset('premiumIcon')),
      await Canvas.loadImage(await getAsset('boosterIcon')),
      await Canvas.loadImage(await getAsset('legacyIcon')),
      await Canvas.loadImage(await getAsset('voiceBar')),
      await Canvas.loadImage(await getAsset('tripsitterBar')),
      await Canvas.loadImage(await getAsset('developerBar')),
      await Canvas.loadImage(await getAsset('teamtripsitBar')),
    ] as const;

    const profileData = values[1];
    const personaData = values[2];
    const levelData = values[3];
    const Icons = values[4];
    const avatar = values[5];

    const avatarIconRoles = {
      [env.ROLE_TEAMTRIPSIT]: {
        image: values[6],
        hierarchy: 1,
      },
      [env.ROLE_PREMIUM]: {
        image: values[7],
        hierarchy: 2,
      },
      [env.ROLE_BOOSTER]: {
        image: values[8],
        hierarchy: 3,
      },
      [env.ROLE_LEGACY]: {
        image: values[9],
        hierarchy: 4,
      },
    };

    // From the list, each icon is assigned to a slot in numerical order
    const avatarIcons = getAvatarIcons(target, avatarIconRoles);

    // Default Progress Bars Calculate
    const progressTotal = ratio(levelData.ALL.TOTAL.level_exp, levelData.ALL.TOTAL.nextLevel);
    const progressGeneral = levelData.TEXT.GENERAL
      ? ratio(levelData.TEXT.GENERAL.level_exp, levelData.TEXT.GENERAL.nextLevel)
      : 0;

    // Assign the xp bars to slots and decide the canvas height based on how many bars there are
    const xpBars = getXpBars(target, levelData, {
      voiceBar: values[10],
      tripsitterBar: values[11],
      developerBar: values[12],
      teamtripsitBar: values[13],
    });
    const layoutHeight = LAYOUT_HEIGHTS[Math.min(xpBars.length, LAYOUT_HEIGHTS.length - 1)];

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasObj = Canvas.createCanvas(canvasWidth, layoutHeight);
    const context = canvasObj.getContext('2d');

    // Generate the colors for the card based on the user's role color
    // If user is not in guild, use default gray color
    const roleColor = target
      ? `#${(target.roles.color?.colors.primaryColor ?? 0x99aab5).toString(16).padStart(6, '0')}`
      : '#99aab5';

    // Draw the card shape and chips
    drawCardShape(context, {
      light: generateColors(roleColor, 0, -75, -67),
      dark: generateColors(roleColor, 0, -75, -80),
    }, layoutHeight);

    // Purchased Background
    const { userFont, userFlair } = await drawPurchasedExtras(context, personaData, [
      [0, 0, 921, 145],
      [0, 154, 921, layoutHeight - 154],
    ]);
    drawChips(context, generateColors(roleColor, 0, -50, -50), layoutHeight, xpBars.length);
    drawAvatar(context, avatar, avatarIcons);

    // Username Text
    const filteredDisplayName = cardDisplayName(target, targetUser);
    drawUsername(context, canvasObj, filteredDisplayName, {
      textColor: generateColors(roleColor, 0, 0, 0),
      userFont,
      userFlair,
    });

    drawProgressBars(context, generateColors(roleColor, 0, -20, -10), {
      total: progressTotal,
      general: progressGeneral,
    }, xpBars);
    drawLevelText(context, levelData, xpBars);
    drawRankText(context, canvasObj, levelData, xpBars);
    drawLabelsAndTotals(context, layoutHeight, profileData);
    drawIcons(context, Icons, canvasWidth, xpBars);

    // Choose and Draw the Level Image
    const LevelImage = await Canvas.loadImage(await getAsset(levelBadgeName(levelData.ALL.TOTAL.level)));
    context.drawImage(LevelImage, 97, 181, 58, 58);

    // Process The Entire Card and Send it to Discord
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    }).replace(/ /g, '-');
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), {
      name: `TS_Levels_${filteredDisplayName}_${formattedDate}.png`,
    });
    await interaction.editReply({
      files: [attachment],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setLabel('Level Calculator')
            .setEmoji('🧮')
            .setStyle(ButtonStyle.Link)
            .setURL(levelCalculatorUrl),
        ]),
      ],
    });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLevels;
