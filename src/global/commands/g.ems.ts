import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import EMSLINES from '../../../assets/data/ems_lines.json';
import SUICIDELINES from '../../../assets/data/suicide_hotlines.json';

const REFRESH_DAYS = 5;
const RETRY_MS = 60 * 60 * 1000;
const DAY_MS = 1000 * 3600 * 24;

let lastRefresh: Date | undefined;
let lastAttempt: Date | undefined;

const F = f(__filename);

// Lookups read this snapshot. It starts as the bundled data and is replaced only by a validated refresh.
let snapshot: any[] = Object.values(EMSLINES);

function isCountryList(data: unknown): data is any[] {
  return Array.isArray(data) && data.length > 0
    && data.every(country => typeof country?.Country?.Name === 'string');
}

async function refreshSnapshot(now: Date): Promise<void> {
  lastAttempt = now;
  try {
    const response = await axios.get('https://emergencynumberapi.com/api/data/all');

    log.debug(F, `EMS API Response: ${response.status} ${response.statusText}`);

    // Transform object values into a new array with suicide lines merged in
    const updatedData = Object.values(response.data ?? {}).map((country: any) => {
      const matchingLine = SUICIDELINES.find(
        line => line.Country.toLowerCase() === country?.Country?.Name?.toLowerCase(),
      );

      return {
        ...country,
        Suicide: matchingLine?.Hotline ?? country?.Suicide,
      };
    });

    if (!isCountryList(updatedData)) {
      log.warn(F, 'EMS API returned an unusable payload; keeping the previous EMS lines');
      return;
    }

    snapshot = updatedData;
    lastRefresh = now;
    log.debug(F, 'Refreshed EMS lines');

    try {
      const dataPath = path.join(__dirname, '../../../assets/data/ems_lines.json');
      fs.writeFileSync(dataPath, JSON.stringify(updatedData, null, 2), 'utf8');
    } catch (err) {
      log.warn(F, `Could not save the refreshed EMS lines: ${err}`);
    }
  } catch (err) {
    log.warn(F, `Could not refresh the EMS lines; keeping the previous ones: ${err}`);
  }
}

export async function ems(search: string): Promise<any[]> {
  const now = new Date();

  // 1. Refresh the snapshot every few days. A failed attempt is retried at most hourly, and lookups keep using
  // the last usable snapshot meanwhile.
  const refreshDue = lastRefresh === undefined || (now.getTime() - lastRefresh.getTime()) / DAY_MS >= REFRESH_DAYS;
  const retryAllowed = lastAttempt === undefined || now.getTime() - lastAttempt.getTime() >= RETRY_MS;
  if (refreshDue && retryAllowed) {
    await refreshSnapshot(now);
  }

  // 2. Search Logic (Functional Style)

  // Create unique, non-empty search tokens
  const comparators = [...new Set(search.toLowerCase().split(' ').filter(t => t.length > 0))];

  if (comparators.length === 0) return [];

  // Filter the dataset based on token match threshold
  return snapshot.filter((country: any) => {
    const countryNameParts: string[] = country.Country.Name.toLowerCase().split(' ');

    // Count how many search tokens match at least one part of the country name
    const matchCount = comparators.filter(comp => countryNameParts.some(part => part.startsWith(comp))).length;

    // Return true if at least half the tokens match
    return matchCount >= comparators.length / 2;
  });
}

export default ems;
