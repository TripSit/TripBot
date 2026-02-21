import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import EMSLINES from '../../../assets/data/ems_lines.json';
import SUICIDELINES from '../../../assets/data/suicide_hotlines.json';

let lastRefresh: Date;

const F = f(__filename);

export async function ems(search: string): Promise<any[]> {
  const now = new Date();

  // 1. Handle Cache Refresh (Every 5 days)
  if (lastRefresh === undefined || (now.getTime() - lastRefresh.getTime()) / (1000 * 3600 * 24) >= 5) {
    const response = await axios.get('https://emergencynumberapi.com/api/data/all');

    log.debug(F, `EMS API Response: ${response.status} ${response.statusText}`);

    // Transform object values into a new array with suicide lines merged in
    const updatedData = Object.values(response.data).map((country: any) => {
      const matchingLine = SUICIDELINES.find(
        line => line.Country.toLowerCase() === country.Country.Name.toLowerCase(),
      );

      return {
        ...country,
        Suicide: matchingLine?.Hotline ?? country.Suicide,
      };
    });

    const dataPath = path.join(__dirname, '../../../assets/data/ems_lines.json');

    fs.writeFileSync(dataPath, JSON.stringify(updatedData, null, 2), 'utf8');

    lastRefresh = now;
    console.debug('EMS: Refreshed EMS Lines');
  }

  // 2. Search Logic (Functional Style)

  // Create unique, non-empty search tokens
  const comparators = [...new Set(search.toLowerCase().split(' ').filter(t => t.length > 0))];

  if (comparators.length === 0) return [];

  // Filter the dataset based on token match threshold
  return Object.values(EMSLINES).filter((country: any) => {
    const countryNameParts: string[] = country.Country.Name.toLowerCase().split(' ');

    // Count how many search tokens match at least one part of the country name
    const matchCount = comparators.filter(comp => countryNameParts.some(part => part.startsWith(comp))).length;

    // Return true if at least half the tokens match
    return matchCount >= comparators.length / 2;
  });
}

export default ems;
