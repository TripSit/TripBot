import { BaseInteraction } from 'discord.js';
import fs from 'fs';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

// src/locales/<locale>/<namespace>.json
// __dirname is build/src/i18n at runtime; locales are not copied to build so use cwd-relative path.
const LOCALES_DIR = path.join(process.cwd(), 'src/locales');

/** Load i18next once at startup. Namespaces are derived from en-US json files. */
export async function initI18n(): Promise<void> {
  const preload = fs.existsSync(LOCALES_DIR)
    ? fs.readdirSync(LOCALES_DIR).filter(d => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory())
    : ['en-US'];

  // One namespace per command json file — adding a file is enough, no code change needed.
  const ns = fs.readdirSync(path.join(LOCALES_DIR, 'en-US'))
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  await i18next.use(Backend).init({
    lng: global.env?.LOCALE ?? 'en-US',
    fallbackLng: 'en-US', // missing keys fall back to en-US automatically
    ns,
    defaultNS: 'common',
    preload,
    backend: {
      loadPath: path.join(LOCALES_DIR, '{{lng}}/{{ns}}.json'),
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

/** Translate a key for the given locale and namespace. Interpolation vars are optional. */
export function t(locale: string, ns: string, key: string, vars?: Record<string, unknown>): string;
/** Translate using a single dot-namespaced reference ("<ns>.<key>", e.g. "drug.description"). */
export function t(locale: string, ref: string, vars?: Record<string, unknown>): string;
export function t(
  locale: string,
  nsOrRef: string,
  keyOrVars?: string | Record<string, unknown>,
  vars?: Record<string, unknown>,
): string {
  // Dot-namespaced form: t(locale, "ns.key", vars?)
  if (typeof keyOrVars !== 'string') {
    const dot = nsOrRef.indexOf('.');
    const ns = dot === -1 ? nsOrRef : nsOrRef.slice(0, dot);
    const key = dot === -1 ? nsOrRef : nsOrRef.slice(dot + 1);
    return i18next.t(key, { lng: locale, ns, ...keyOrVars }) as string;
  }
  // Separate ns + key form: t(locale, ns, key, vars?)
  return i18next.t(keyOrVars, { lng: locale, ns: nsOrRef, ...vars }) as string;
}

/**
 * Resolve the locale to use for an interaction.
 * Priority: guild DB setting → env LOCALE → en-US.
 */
export async function getLocale(
  interaction: BaseInteraction,
  ns?: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<string> {
  const defaultLocale = global.env?.LOCALE ?? 'en-US';
  if (!interaction.guildId) return defaultLocale;

  try {
    const guildData = await global.db.discord_guilds.findUnique({
      where: { id: interaction.guildId },
      select: { locale: true },
    });
    if (guildData?.locale) return guildData.locale;
  } catch {
    // DB failure: fall through to default
  }

  return defaultLocale;
}

let cachedLocales: string[] | null = null;

/** Returns all valid locale directory names under src/locales (including en-US). Cached after first call. */
export function getAvailableLocales(): string[] {
  if (cachedLocales) return cachedLocales;
  if (!fs.existsSync(LOCALES_DIR)) {
    cachedLocales = ['en-US'];
    return cachedLocales;
  }
  cachedLocales = fs.readdirSync(LOCALES_DIR)
    .filter(d => /^[a-zA-Z-]+$/.test(d) && fs.statSync(path.join(LOCALES_DIR, d)).isDirectory());
  return cachedLocales;
}

/**
 * Build a Discord command localization map for a key across all non-default locales.
 * Used when registering slash commands so Discord shows translated names/descriptions.
 */
export function getCommandLocalizations(ns: string, key: string): Record<string, string>;
/** Or pass a single dot-namespaced reference ("<ns>.<key>", e.g. "drug.description"). */
export function getCommandLocalizations(ref: string): Record<string, string>;
export function getCommandLocalizations(nsOrRef: string, key?: string): Record<string, string> {
  // Dot-namespaced form: getCommandLocalizations("ns.key"). First dot is the separator.
  let ns = nsOrRef;
  if (key === undefined) {
    const dot = nsOrRef.indexOf('.');
    if (dot === -1) return {};
    ns = nsOrRef.slice(0, dot);
    key = nsOrRef.slice(dot + 1); // eslint-disable-line no-param-reassign
  }

  const result: Record<string, string> = {};
  if (!fs.existsSync(LOCALES_DIR)) return result;

  const langs = fs.readdirSync(LOCALES_DIR)
    .filter(d => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory() && d !== 'en-US');

  langs.forEach(lang => {
    const filePath = path.join(LOCALES_DIR, lang, `${ns}.json`);
    if (!fs.existsSync(filePath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, string>;
      if (data[key]) result[lang] = data[key];
    } catch {
      // skip malformed files
    }
  });
  return result;
}
