import axios from 'axios';

const F = f(__filename);

export default wikipedia;

export type WikiData = {
  title: string,
  thumbnail: string,
  url: string,
  description: string,
};

/**
 * Retrieve a definition from wikipedia
 * @return {string}
 */
export async function wikipedia(query: string):Promise<WikiData> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=1&namespace=0&format=json`; // eslint-disable-line
    const searchResult = await axios.get(searchUrl);
    // log.debug(F, `seachResult: ${JSON.stringify(searchResult.data, null, 2)}`);

    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${searchResult.data[1][0]}`;
    const result = await axios.get(apiUrl);
    log.debug(F, `result: ${JSON.stringify(result.data, null, 2)}`);

    if (result.data.extract === undefined) {
      return {
        title: '',
        thumbnail: '',
        url: '',
        description: '',
      };
    }

    if (result.data.type === 'disambiguation') {
      return {
        title: 'CHS returned multiple results, please be more specific!',
        thumbnail: '',
        url: '',
        description: '',
      };
    }

    log.debug(F, `result: ${JSON.stringify(result.data.extract, null, 2)}`);

    const extract = result.data.extract_html;

    // Take all the html tags and convert to markdown
    const newExtract = extract
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '')
      .replace(/<b>/g, '**')
      .replace(/<\/b>/g, '**')
      .replace(/<i>/g, '*')
      .replace(/<\/i>/g, '*')
      .replace(/<a href="(.*)">(.*)<\/a>/g, '[$2]($1)');

    return {
      title: result.data.title,
      thumbnail: result.data.thumbnail.source,
      url: result.data.content_urls.desktop.page,
      description: newExtract,
    };
  } catch (e) {
    log.error(F, `${(e as Error).message} query: ${query}`);
    return {
      title: '',
      thumbnail: '',
      url: '',
      description: '',
    };
  }
}
