import axios from 'axios';

const F = f(__filename);

export default fact;

export async function fact(): Promise<string> {
  // log.debug(F, `jo ke()`);
  log.debug(F, `env.RAPID_TOKEN: ${env.RAPID_TOKEN}`);
  const { data } = await axios.get('https://facts-by-api-ninjas.p.rapidapi.com/v1/facts', {
    headers: {
      'X-RapidAPI-Host': 'facts-by-api-ninjas.p.rapidapi.com',
      'X-RapidAPI-Key': env.RAPID_TOKEN,
    },
  });
  return data[0].fact;
}
