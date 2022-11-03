import axios from 'axios';
import env from '../utils/env.config';

/**
 *
 * @return {any}
 */
export async function joke():Promise<any> {
  const {data} = await axios.get('https://jokeapi-v2.p.rapidapi.com/joke/Misc,Pun', {
    params: {
      'format': 'json',
      'blacklistFlags': 'nsfw,religious,political,racist,sexist,explicit',
      'safe-mode': 'true',
    },
    headers: {
      'X-RapidAPI-Host': 'jokeapi-v2.p.rapidapi.com',
      'X-RapidAPI-Key': env.RAPID_TOKEN,
    },
  });

  return data;
};
