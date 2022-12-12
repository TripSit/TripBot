import axios from 'axios';

const F = f(__filename);

type Joke = {
  type: 'twopart' | 'single';
  setup?: string;
  delivery?: string;
  joke?: string;
};

export default joke;

/**
 *
 * @return {any}
 */
export async function joke():Promise<Joke> {
  // log.debug(F, `joke()`);
  // log.debug(F, `env.RAPID_TOKEN: ${env.RAPID_TOKEN}`);
  const { data } = await axios.get('https://jokeapi-v2.p.rapidapi.com/joke/Misc,Pun', {
    params: {
      format: 'json',
      blacklistFlags: 'nsfw,religious,political,racist,sexist,explicit',
      'safe-mode': 'true',
    },
    headers: {
      'X-RapidAPI-Host': 'jokeapi-v2.p.rapidapi.com',
      'X-RapidAPI-Key': env.RAPID_TOKEN,
    },
  });

  log.info(F, `response: ${JSON.stringify(data, null, 2)}`);

  return data as Joke;
}
