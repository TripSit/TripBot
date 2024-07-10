import axios from 'axios';
import fs from 'fs';
import EMSLINES from '../../../assets/data/ems_lines.json';
import SUICIDELINES from '../../../assets/data/suicide_hotlines.json';

export default ems;
let lastRefresh : Date;

export async function ems(search : string):Promise<any[]> {
  // cache whole dataset
  const data : any[] = [];
  if (lastRefresh === undefined || (new Date().getTime() - lastRefresh.getTime()) / (1000 * 3600 * 24) >= 5) {
    const fetched = await axios.get('https://emergencynumberapi.com/api/data/all').then(response => response.data);
    for (const country of Object.values(fetched)) {
      // @ts-ignore
      for (const line of SUICIDELINES) {
        // @ts-ignore
        if (line.Country.toLowerCase() === country.Country.Name.toLowerCase()) {
          // @ts-ignore
          country.Suicide = line.Hotline;
          break;
        }
      }
    }
    fs.writeFile('assets/data/ems_lines.json', JSON.stringify(fetched), 'utf8', err => { if (err) throw err; });
    lastRefresh = new Date();
    log.debug('EMS', 'Refreshed EMS Lines');
  }
  const comparators : Set<string> = new Set(search.split(' ')); // tokenize for unique
  // Search for all countries who's names match the given input. each space is considered as another token
  for (const country of Object.values(EMSLINES)) {
    let matches = 0;
    const names = country.Country.Name.toLowerCase().split(' ');
    for (const comp of comparators) {
      if (names.some(name => name.startsWith(comp.toLowerCase()))) {
        matches++;
      }
    }
    if (matches >= comparators.size / 2) {
      data.push(country);
    }
  }

  return data;
}
