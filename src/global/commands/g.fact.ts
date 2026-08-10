import axios from 'axios';

export default fact;

export async function fact():Promise<string> {
  let response = 'No fact available.';
  if (env.RAPID_TOKEN && env.RAPID_TOKEN !== '<Optional>') {
    const { data } = await axios.get('https://facts-by-api-ninjas.p.rapidapi.com/v1/facts', {
      headers: {
        'X-RapidAPI-Host': 'facts-by-api-ninjas.p.rapidapi.com',
        'X-RapidAPI-Key': env.RAPID_TOKEN,
      },
    });
    response = data[0].fact;
  }
  return response;
}
