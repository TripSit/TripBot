import axios from 'axios';
import { stripIndents } from 'common-tags';

const F = f(__filename);

export default urbandefine;

/**
 * Birthday information of a user
 * @param {string} term
 * @return {string} definition
 */
export async function urbandefine(term:string) {
  const { data } = await axios.get(
    'https://mashape-community-urban-dictionary.p.rapidapi.com/define',
    {
      params: { term },
      headers: {
        'X-RapidAPI-Host': 'mashape-community-urban-dictionary.p.rapidapi.com',
        'X-RapidAPI-Key': env.RAPID_TOKEN,
        useQueryString: true,
      },
    },
  );

  type UrbanDefinition = {
    definition: string,
    permalink: string,
    thumbs_up: number,
    sound_urls: string[],
    author: string,
    word: string,
    defid: number,
    current_vote: string,
    written_on: string,
    example: string,
    thumbs_down: number
  };

  // Sort data by the thumbs_up value
  (data.list as UrbanDefinition[]).sort((a, b) => b.thumbs_up - a.thumbs_up);
  const definition = `${data.list[0].definition.length > 1024
    ? `${data.list[0].definition.slice(0, 1020)}...`
    : data.list[0].definition}`.replace(/\[|\]/g, '');

  const example = `${data.list[0].example}`.replace(/\[|\]/g, '');

  const upvotes = `${data.list[0].thumbs_up}`;
  const downvotes = `${data.list[0].thumbs_down}`;

  const response = stripIndents`**Definition for "${term}" ** (+${upvotes}/-${downvotes})
    ${definition}
    Example: ${example}`;
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
