import Canvas from '@napi-rs/canvas';
import { GuildMember, User } from 'discord.js';
import { getPersonaInfo } from '../../global/commands/g.rpg';
import getAsset from './getAsset';
import { deFuckifyText, resizeText } from './canvasUtils';

// Drawing helpers shared by the /profile and /levels cards.

export type Ctx = Canvas.SKRSContext2D;
export type PersonaData = Awaited<ReturnType<typeof getPersonaInfo>>;

// Positions of the four icon slots around the avatar (hole centre for the clip, icon top-left for the image)
export const AVATAR_ICON_SLOTS = [
  {
    holeX: 115, holeY: 117, iconX: 99, iconY: 102,
  },
  {
    holeX: 31, holeY: 117, iconX: 15, iconY: 102,
  },
  {
    holeX: 115, holeY: 28, iconX: 99, iconY: 12,
  },
  {
    holeX: 31, holeY: 28, iconX: 15, iconY: 12,
  },
];

export function getAvatarIcons(
  target: GuildMember | null,
  icons: Record<string, { image: Canvas.Image; hierarchy: number }>,
): Canvas.Image[] {
  // Check if user has any roles that have an avatar icon. Put all of them in an array and sort them by hierarchy
  // If target is null (not in guild), this will be an empty array
  if (!target) return [];
  return Object.entries(icons)
    .filter(([key]) => target.roles.cache.has(key))
    .sort((a, b) => a[1].hierarchy - b[1].hierarchy)
    .slice(0, AVATAR_ICON_SLOTS.length)
    .map(([, icon]) => icon.image);
}

export async function drawPurchasedExtras(
  context: Ctx,
  personaData: PersonaData,
  backgroundRects: [number, number, number, number][],
): Promise<{ userFont: string; userFlair: string }> {
  let userFont = 'futura';
  let userFlair = '';
  if (!personaData) return { userFont, userFlair };

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  const equippedBackground = inventoryData.find(item => item.equipped === true && item.effect === 'background');
  const equippedFont = inventoryData.find(item => item.equipped === true && item.effect === 'font');
  const equippedFlair = inventoryData.find(item => item.equipped === true && item.effect === 'userflair');
  if (equippedBackground) {
    const imagePath = await getAsset(equippedBackground.value);
    const Background = await Canvas.loadImage(imagePath);
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.globalAlpha = 0.04;
    context.beginPath();
    backgroundRects.forEach(rect => context.roundRect(...rect, [19]));
    context.clip();
    context.drawImage(Background, 0, 0);
    context.restore();
  }
  if (equippedFont) {
    await getAsset(equippedFont.value);
    userFont = equippedFont.value;
  }
  if (equippedFlair) {
    userFlair = equippedFlair.effect_value;
  }
  return { userFont, userFlair };
}

export function drawAvatar(context: Ctx, avatar: Canvas.Image, avatarIcons: Canvas.Image[]): void {
  // Overly complicated avatar clip
  context.save();
  // If an avatar icon slot has an image, draw the hole for the icon
  avatarIcons.forEach((_, index) => {
    const slot = AVATAR_ICON_SLOTS[index];
    context.beginPath();
    context.arc(slot.holeX, slot.holeY, 21, 0, Math.PI * 2);
    context.arc(73, 73, 55, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
  });
  context.beginPath();
  context.arc(73, 73, 54, 0, Math.PI * 2, true);
  context.clip();

  context.drawImage(avatar, 18, 18, 109, 109);
  context.restore();

  // Draw the avatar icons
  avatarIcons.forEach((image, index) => {
    const slot = AVATAR_ICON_SLOTS[index];
    context.drawImage(image, slot.iconX, slot.iconY, 32, 32);
  });
}

export function drawUsername(
  context: Ctx,
  canvasObj: Canvas.Canvas,
  name: string,
  style: { textColor: string; userFont: string; userFlair: string },
): void {
  context.fillStyle = style.textColor;
  context.font = `50px ${style.userFont}`;
  context.textAlign = 'left';
  let usernameHeight = 76;
  const maxLength = 508;
  context.textBaseline = 'middle';

  if (style.userFlair) {
    usernameHeight = 78;
    context.textBaseline = 'top';
    context.font = resizeText(canvasObj, style.userFlair, 30, 'futura', maxLength);
    context.fillText(`${style.userFlair}`, 146, 100);
    context.textBaseline = 'bottom';
  }

  context.font = resizeText(canvasObj, name, 50, style.userFont, maxLength);
  context.fillText(`${name}`, 146, usernameHeight);
  context.textBaseline = 'middle';
}

// Choose the level badge: one badge per ten levels, capped at the last one
export function levelBadgeName(level: number): string {
  if (level <= 9) return 'badgeVip0';
  if (level >= 100) return 'badgeVip10';
  return `badgeVip${Math.floor(level / 10)}`;
}

/** The name to print on a card: their display name, or a tidied username when the display name is mostly symbols. */
export function cardDisplayName(target: GuildMember | null, targetUser: User): string {
  // Use displayName if user is in guild, otherwise use username
  const displayNameToUse = target?.displayName ?? targetUser.username;
  const filteredDisplayName = deFuckifyText(displayNameToUse);
  // If the filteredDisplayName is much shorter than what was input, display their username as a fallback
  if (filteredDisplayName.length < displayNameToUse.length / 2) {
    return targetUser.username.charAt(0).toUpperCase() + targetUser.username.slice(1);
  }
  return filteredDisplayName;
}
