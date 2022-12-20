import axios from 'axios';

const F = f(__filename);

export default wikipedia;

/**
 * Retrieve a definition from wikipedia
 * @return {string}
 */
export async function wikipedia(query: string):Promise<string> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=1&namespace=0&format=json`; // eslint-disable-line
    const searchResult = await axios.get(searchUrl);
    // log.debug(F, `seachResult: ${JSON.stringify(searchResult.data, null, 2)}`);

    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${searchResult.data[1][0]}`;
    const result = await axios.get(apiUrl);
    // log.debug(F, `result: ${JSON.stringify(result.data.extract, null, 2)}`);

    if (result.data.extract === undefined) {
      return `No definition found for ${query} on wikipedia.`;
    }

    return result.data.extract;
  } catch (e) {
    log.error(F, `${(e as Error).message} query: ${query}`);
    return `An error occured while trying to fetch the definition for ${query} from wikipedia.`;
  }
}
