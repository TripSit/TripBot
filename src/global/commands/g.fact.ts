import axios from 'axios';

const F = f(__filename);

export default fact;

/**
 *
 * @return {any}
 */
export async function fact():Promise<string> {
  // log.debug(F, `joke()`);
  // log.debug(F, `env.RAPID_TOKEN: ${env.RAPID_TOKEN}`);
  const { data } = await axios.get('https://facts-by-api-ninjas.p.rapidapi.com/v1/facts', {
    params: {
      limit: 1,
    },
    headers: {
      'X-RapidAPI-Host': 'facts-by-api-ninjas.p.rapidapi.com',
      'X-RapidAPI-Key': env.RAPID_TOKEN,
    },
  });

  log.info(F, `response: ${JSON.stringify(data, null, 2)}`);

  return data[0].fact;
}
