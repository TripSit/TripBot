import axios from 'axios';

const F = f(__filename);

export default wikipedia;

export interface WikiData {
  description: string;
  thumbnail: string;
  title: string;
  url: string;
}

/**
 * Retrieve a definition from wikipedia
 * @return {string}
 */
export async function wikipedia(query: string): Promise<WikiData> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=1&namespace=0&format=json`;
    const searchResult = await axios.get(searchUrl);
    // log.debug(F, `seachResult: ${JSON.stringify(searchResult.data, null, 2)}`);

    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${searchResult.data[1][0]}`;
    const result = await axios.get(apiUrl);
    log.debug(F, `result: ${JSON.stringify(result.data, null, 2)}`);

    if (result.data.extract === undefined) {
      return {
        description: '',
        thumbnail: '',
        title: '',
        url: '',
      };
    }

    if (result.data.type === 'disambiguation') {
      return {
        description: '',
        thumbnail: '',
        title: 'CHS returned multiple results, please be more specific!',
        url: '',
      };
    }

    log.debug(F, `result: ${JSON.stringify(result.data.extract, null, 2)}`);

    const extract = result.data.extract_html;

    // Take all the html tags and convert to markdown
    const newExtract = extract
      .replaceAll('<p>', '')
      .replaceAll('</p>', '')
      .replaceAll('<b>', '**')
      .replaceAll('</b>', '**')
      .replaceAll('<i>', '*')
      .replaceAll('</i>', '*')
      .replaceAll(/<a href="(.*)">(.*)<\/a>/g, '[$2]($1)');

    return {
      description: newExtract,
      thumbnail: result.data.thumbnail.source,
      title: result.data.title,
      url: result.data.content_urls.desktop.page,
    };
  } catch (error) {
    log.error(F, `${(error as Error).message} query: ${query}`);
    return {
      description: '',
      thumbnail: '',
      title: '',
      url: '',
    };
  }
}
