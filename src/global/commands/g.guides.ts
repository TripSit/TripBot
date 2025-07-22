import axios from 'axios';

export default wikiGuides;

/**
 * Get all the guides from the wiki
 * @return {any}
 */

export async function wikiGuides(): Promise<string[]> {
  const array: string[] = [];

  const response = await axios.get(
    'https://wiki.tripsit.me/api.php?action=query&list=categorymembers&cmtitle=Category:Guides&format=json&cmlimit=9999',
  );

  const result = response.data.query.categorymembers;

  for (const element of result) {
    array.push(element.title.split(' ').join('_'));
  }
  return array;
}
