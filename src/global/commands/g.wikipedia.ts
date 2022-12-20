import axios from 'axios';

const F = f(__filename);

export default wikipedia;

/**
 * Retrieve a definition from wikipedia
 * @return {string}
 */
export async function wikipedia(query: string):Promise<string> {
  try {
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`,
    );
    return response.data.extract;
  } catch (e) {
    log.debug(F, `${(e as Error).message} query: ${query}`);
    return `An error occured while trying to fetch the definition for ${query} from wikipedia.`;
  }
}
