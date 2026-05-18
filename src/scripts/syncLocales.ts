#!/usr/bin/env ts-node
/**
 * Syncs all non-default locale files against en-US (the source of truth).
 *
 * What it does:
 *   - Adds missing namespace files to non-default locales (all keys empty)
 *   - Adds missing keys to existing files (empty string placeholder)
 *   - Removes keys that no longer exist in en-US
 *   - Reorders keys to match en-US order
 *   - Never overwrites a non-empty translation
 *
 * Usage:
 *   npm run i18n:sync           # apply changes
 *   npm run i18n:sync -- --dry  # preview without writing
 */

import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(__dirname, '../../src/locales');
const DEFAULT_LOCALE = 'en-US';
const DRY_RUN = process.argv.includes('--dry');

type Translations = Record<string, string>;

function readJson(filePath: string): Translations {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Translations;
}

function writeJson(filePath: string, data: Translations): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

function syncFile(sourcePath: string, targetPath: string, locale: string, ns: string): boolean {
  const source = readJson(sourcePath);
  const target: Translations = fs.existsSync(targetPath) ? readJson(targetPath) : {};

  const sourceKeys = Object.keys(source);
  const sourceKeySet = new Set(sourceKeys);
  const targetKeySet = new Set(Object.keys(target));

  const added = sourceKeys.filter(k => !targetKeySet.has(k));
  const removed = [...targetKeySet].filter(k => !sourceKeySet.has(k));

  // Build synced object in en-US key order, preserving existing translations
  const synced: Translations = Object.fromEntries(
    sourceKeys.map(k => [k, targetKeySet.has(k) ? target[k] : '']),
  );

  const changed = added.length > 0 || removed.length > 0
    || JSON.stringify(Object.keys(target)) !== JSON.stringify(sourceKeys);

  if (!changed) return false;

  const label = `  [${locale}/${ns}]`;
  if (added.length) process.stdout.write(`${label} +${added.length} missing: ${added.join(', ')}\n`);
  if (removed.length) process.stdout.write(`${label} -${removed.length} removed: ${removed.join(', ')}\n`);
  if (!added.length && !removed.length) process.stdout.write(`${label} reordered keys\n`);

  if (!DRY_RUN) writeJson(targetPath, synced);
  return true;
}

function run(): void {
  if (DRY_RUN) process.stdout.write('Dry run — no files will be written.\n\n');

  const defaultDir = path.join(LOCALES_DIR, DEFAULT_LOCALE);
  const namespaces = fs.readdirSync(defaultDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  const locales = fs.readdirSync(LOCALES_DIR)
    .filter(d => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory() && d !== DEFAULT_LOCALE && /^[a-zA-Z-]+$/.test(d));

  let totalChanges = 0;

  locales.forEach(locale => {
    const localeDir = path.join(LOCALES_DIR, locale);

    namespaces.forEach(ns => {
      const sourcePath = path.join(defaultDir, `${ns}.json`);
      const targetPath = path.join(localeDir, `${ns}.json`);

      if (!fs.existsSync(targetPath)) {
        const source = readJson(sourcePath);
        const empty: Translations = Object.fromEntries(Object.keys(source).map(k => [k, '']));
        process.stdout.write(`  [${locale}/${ns}] created (${Object.keys(empty).length} keys to translate)\n`);
        if (!DRY_RUN) writeJson(targetPath, empty);
        totalChanges += 1;
        return;
      }

      if (syncFile(sourcePath, targetPath, locale, ns)) {
        totalChanges += 1;
      }
    });
  });

  if (totalChanges === 0) {
    process.stdout.write('All locales are in sync.\n');
  } else if (DRY_RUN) {
    process.stdout.write(`\n${totalChanges} file(s) would be updated.\n`);
  } else {
    process.stdout.write(`\n${totalChanges} file(s) updated.\n`);
  }
}

run();
