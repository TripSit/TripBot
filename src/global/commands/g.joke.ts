import axios from 'axios';

const F = f(__filename);

interface Joke {
  delivery?: string;
  joke?: string;
  setup?: string;
  type: 'single' | 'twopart';
}

export default joke;

/**
 *
 * @return {any}
 */
export async function joke(): Promise<Joke> {
  // log.debug(F, `joke()`);
  // log.debug(F, `env.RAPID_TOKEN: ${env.RAPID_TOKEN}`);
  const { data } = await axios.get('https://jokeapi-v2.p.rapidapi.com/joke/Misc,Pun', {
    headers: {
      'X-RapidAPI-Host': 'jokeapi-v2.p.rapidapi.com',
      'X-RapidAPI-Key': env.RAPID_TOKEN,
    },
    params: {
      blacklistFlags: 'nsfw,religious,political,racist,sexist,explicit',
      format: 'json',
      'safe-mode': 'true',
    },
  });

  log.info(F, `response: ${JSON.stringify(data, null, 2)}`);

  return data as Joke;
}
