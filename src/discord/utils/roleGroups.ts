// Shared groups of env.ROLE_* ids, previously hand-duplicated across tripsitme.ts,
// guildMemberUpdate.ts, tents.ts and d.quote.ts. Keep each group defined once here.

export const TEAM_ROLES = [
  env.ROLE_DIRECTOR,
  env.ROLE_SUCCESSOR,
  env.ROLE_SYSADMIN,
  env.ROLE_LEADDEV,
  env.ROLE_IRCADMIN,
  env.ROLE_DISCORDADMIN,
  env.ROLE_IRCOP,
  env.ROLE_MODERATOR,
  env.ROLE_TRIPSITTER,
  env.ROLE_TEAMTRIPSIT,
  env.ROLE_TRIPBOT2,
  env.ROLE_TRIPBOT,
  env.ROLE_BOT,
  env.ROLE_DEVELOPER,
];

export const LEGACY_COLOR_ROLES = [
  env.ROLE_TREE,
  env.ROLE_SPROUT,
  env.ROLE_SEEDLING,
  env.ROLE_RED,
  env.ROLE_REDORANGE,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_YELLOWGREEN,
  env.ROLE_GREEN,
  env.ROLE_GREENBLUE,
  env.ROLE_BLUE,
  env.ROLE_BLUEPURPLE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  env.ROLE_PINKRED,
  env.ROLE_WHITE,
];

export const LEVEL_COLOR_ROLES = {
  ROLE_LEVEL_RED: env.ROLE_LEVEL_RED,
  ROLE_LEVEL_REDORANGE: env.ROLE_LEVEL_REDORANGE,
  ROLE_LEVEL_ORANGE: env.ROLE_LEVEL_ORANGE,
  ROLE_LEVEL_YELLOW: env.ROLE_LEVEL_YELLOW,
  ROLE_LEVEL_YELLOWGREEN: env.ROLE_LEVEL_YELLOWGREEN,
  ROLE_LEVEL_GREEN: env.ROLE_LEVEL_GREEN,
  ROLE_LEVEL_GREENBLUE: env.ROLE_LEVEL_GREENBLUE,
  ROLE_LEVEL_BLUE: env.ROLE_LEVEL_BLUE,
  ROLE_LEVEL_BLUEPURPLE: env.ROLE_LEVEL_BLUEPURPLE,
  ROLE_LEVEL_PURPLE: env.ROLE_LEVEL_PURPLE,
  ROLE_LEVEL_PINK: env.ROLE_LEVEL_PINK,
  ROLE_LEVEL_PINKRED: env.ROLE_LEVEL_PINKRED,
  ROLE_LEVEL_BLACK: env.ROLE_LEVEL_BLACK,
} as const;

export type LevelColorName = keyof typeof LEVEL_COLOR_ROLES;

export const DONOR_COLOR_ROLES = {
  ROLE_GRADIENT_1: env.ROLE_GRADIENT_1,
  ROLE_GRADIENT_2: env.ROLE_GRADIENT_2,
  ROLE_GRADIENT_3: env.ROLE_GRADIENT_3,
  ROLE_GRADIENT_4: env.ROLE_GRADIENT_4,
  ROLE_GRADIENT_5: env.ROLE_GRADIENT_5,
  ROLE_GRADIENT_6: env.ROLE_GRADIENT_6,
  ROLE_GRADIENT_7: env.ROLE_GRADIENT_7,
  ROLE_GRADIENT_8: env.ROLE_GRADIENT_8,
  ROLE_GRADIENT_9: env.ROLE_GRADIENT_9,
  ROLE_GRADIENT_10: env.ROLE_GRADIENT_10,
  ROLE_GRADIENT_11: env.ROLE_GRADIENT_11,
  ROLE_GRADIENT_12: env.ROLE_GRADIENT_12,
  ROLE_GRADIENT_13: env.ROLE_GRADIENT_13,
  ROLE_GRADIENT_14: env.ROLE_GRADIENT_14,
  ROLE_GRADIENT_15: env.ROLE_GRADIENT_15,
  ROLE_GRADIENT_16: env.ROLE_GRADIENT_16,
  ROLE_GRADIENT_17: env.ROLE_GRADIENT_17,
  ROLE_GRADIENT_18: env.ROLE_GRADIENT_18,
  ROLE_GRADIENT_19: env.ROLE_GRADIENT_19,
  ROLE_GRADIENT_20: env.ROLE_GRADIENT_20,
  ROLE_GRADIENT_21: env.ROLE_GRADIENT_21,
  ROLE_GRADIENT_22: env.ROLE_GRADIENT_22,
  ROLE_GRADIENT_23: env.ROLE_GRADIENT_23,
  ROLE_GRADIENT_24: env.ROLE_GRADIENT_24,
} as const;

export type DonorColorName = keyof typeof DONOR_COLOR_ROLES;

// Mindsets tracked for the team-mindset TTS swap in guildMemberUpdate.ts.
// NOTE: no SOBER here (no ROLE_TTS_SOBER exists) and no STATUS_MINDSET_ROLES either today,
// matching current behavior exactly.
export const CORE_MINDSET_ROLES = {
  ROLE_DRUNK: env.ROLE_DRUNK,
  ROLE_HIGH: env.ROLE_HIGH,
  ROLE_ROLLING: env.ROLE_ROLLING,
  ROLE_TRIPPING: env.ROLE_TRIPPING,
  ROLE_DISSOCIATING: env.ROLE_DISSOCIATING,
  ROLE_STIMMING: env.ROLE_STIMMING,
  ROLE_SEDATED: env.ROLE_SEDATED,
} as const;

export const STATUS_MINDSET_ROLES = {
  ROLE_TALKATIVE: env.ROLE_TALKATIVE,
  ROLE_VOICECHATTY: env.ROLE_VOICECHATTY,
  ROLE_BUSY: env.ROLE_BUSY,
} as const;

export const EVENT_MINDSET_ROLES = {
  ROLE_EVENT_1: env.ROLE_EVENT_1,
  ROLE_EVENT_2: env.ROLE_EVENT_2,
  ROLE_EVENT_3: env.ROLE_EVENT_3,
  ROLE_EVENT_4: env.ROLE_EVENT_4,
  ROLE_EVENT_5: env.ROLE_EVENT_5,
  ROLE_EVENT_6: env.ROLE_EVENT_6,
  ROLE_EVENT_7: env.ROLE_EVENT_7,
  ROLE_EVENT_8: env.ROLE_EVENT_8,
  ROLE_EVENT_9: env.ROLE_EVENT_9,
  ROLE_EVENT_10: env.ROLE_EVENT_10,
  ROLE_EVENT_11: env.ROLE_EVENT_11,
} as const;

// guildMemberUpdate's mindset map: core + status + event, no SOBER (matches current behavior).
export const MINDSET_ROLES = {
  ...CORE_MINDSET_ROLES,
  ...STATUS_MINDSET_ROLES,
  ...EVENT_MINDSET_ROLES,
} as const;

export type MindsetName = keyof typeof MINDSET_ROLES;

export const TTS_MINDSET_ROLES = {
  ROLE_TTS_DRUNK: env.ROLE_TTS_DRUNK,
  ROLE_TTS_HIGH: env.ROLE_TTS_HIGH,
  ROLE_TTS_ROLLING: env.ROLE_TTS_ROLLING,
  ROLE_TTS_TRIPPING: env.ROLE_TTS_TRIPPING,
  ROLE_TTS_DISSOCIATING: env.ROLE_TTS_DISSOCIATING,
  ROLE_TTS_STIMMING: env.ROLE_TTS_STIMMING,
  ROLE_TTS_SEDATED: env.ROLE_TTS_SEDATED,
  ROLE_TTS_TALKATIVE: env.ROLE_TTS_TALKATIVE,
  ROLE_TTS_VOICECHATTY: env.ROLE_TTS_VOICECHATTY,
  ROLE_TTS_BUSY: env.ROLE_TTS_BUSY,
  ROLE_TTS_EVENT_1: env.ROLE_TTS_EVENT_1,
  ROLE_TTS_EVENT_2: env.ROLE_TTS_EVENT_2,
  ROLE_TTS_EVENT_3: env.ROLE_TTS_EVENT_3,
  ROLE_TTS_EVENT_4: env.ROLE_TTS_EVENT_4,
  ROLE_TTS_EVENT_5: env.ROLE_TTS_EVENT_5,
  ROLE_TTS_EVENT_6: env.ROLE_TTS_EVENT_6,
  ROLE_TTS_EVENT_7: env.ROLE_TTS_EVENT_7,
  ROLE_TTS_EVENT_8: env.ROLE_TTS_EVENT_8,
  ROLE_TTS_EVENT_9: env.ROLE_TTS_EVENT_9,
  ROLE_TTS_EVENT_10: env.ROLE_TTS_EVENT_10,
  ROLE_TTS_EVENT_11: env.ROLE_TTS_EVENT_11,
} as const;

export type TtsMindsetName = keyof typeof TTS_MINDSET_ROLES;

export const SUPPORTER_ROLES = [
  env.ROLE_PREMIUM,
  env.ROLE_BOOSTER,
  env.ROLE_PATRON,
];

// level -> VIP role id, 0..100. Shared by /tent and the VIP-gated checks below.
export const VIP_ROLES_BY_LEVEL: { [level: number]: string } = {
  0: env.ROLE_VIP_0,
  10: env.ROLE_VIP_10,
  20: env.ROLE_VIP_20,
  30: env.ROLE_VIP_30,
  40: env.ROLE_VIP_40,
  50: env.ROLE_VIP_50,
  60: env.ROLE_VIP_60,
  70: env.ROLE_VIP_70,
  80: env.ROLE_VIP_80,
  90: env.ROLE_VIP_90,
  100: env.ROLE_VIP_100,
};

// VIP role ids at or above `level`, e.g. vipRolesAtOrAbove(30) -> VIP_30..VIP_100.
export function vipRolesAtOrAbove(level: number): string[] {
  return Object.entries(VIP_ROLES_BY_LEVEL)
    .filter(([lvl]) => Number(lvl) >= level)
    .map(([, roleId]) => roleId);
}

// tripsitme.ts's colorRoles: legacy colors + level colors + donor gradients.
export const TRIPSITME_COLOR_ROLES = [
  ...LEGACY_COLOR_ROLES,
  env.ROLE_BOOSTER,
  ...Object.values(LEVEL_COLOR_ROLES),
  ...Object.values(DONOR_COLOR_ROLES),
];

// tripsitme.ts's mindsetRoles: core mindsets + event mindsets. No status mindsets, matching
// current behavior (TALKATIVE/VOICECHATTY/BUSY are stripped during tripsit sessions today).
// env.ROLE_SOBER was dropped here: it has no entry in env.config.ts (undefined at runtime).
export const TRIPSITME_MINDSET_ROLES = [
  ...Object.values(CORE_MINDSET_ROLES),
  ...Object.values(EVENT_MINDSET_ROLES),
];

export const TRIPSITME_OTHER_ROLES = [
  env.ROLE_PREMIUM,
  env.ROLE_BOOSTER,
  env.ROLE_PATRON,
];
