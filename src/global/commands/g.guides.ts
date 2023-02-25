/* eslint-disable no-restricted-syntax */
import axios from 'axios';

export default wikiGuides;

/**
 * Get all the guides from the wiki
 * @return {any}
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function wikiGuides():Promise<string[]> {
  const arr:string[] = [];

  // eslint-disable-next-line max-len
  const response = await axios.get('https://wiki.tripsit.me/api.php?action=query&list=categorymembers&cmtitle=Category:Guides&format=json');

  const result = response.data.query.categorymembers;

  for (const element of result) {
    arr.push(element.title.split(' ').join('_'));
  }
  return arr;
}
