export const MAX_EXPERIENCE_LEVEL = 100;

export function parseLevelFreeze(value?: string): Record<string, number> {
  return Object.fromEntries((value ?? '').split(',')
    .map(pair => pair.split(':').map(part => part.trim()))
    .filter(([id, levelText]) => {
      if (!id || !/^\d+$/.test(levelText)) return false;

      const level = Number(levelText);
      return Number.isSafeInteger(level)
        && level >= 0
        && level <= MAX_EXPERIENCE_LEVEL;
    })
    .map(([id, levelText]) => [id, Number(levelText)]));
}
