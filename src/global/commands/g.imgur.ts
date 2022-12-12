import axios from 'axios';

const F = f(__filename);

export default imgurSearch;

/**
 *
 * @param {string} query
 */
export async function imgurSearch(query:string):Promise<string> {
  /**
   * This needs to be in a separate function cuz it's not async
   */
  async function searchImgur():Promise<string> {
    return new Promise((resolve, reject) => {
      axios.get(query, {
        headers: {
          Authorization: `Client-ID ${env.IMGUR_ID}`,
        },
      }).then(res => {
        let imageLink = '';

        if (res.data.data.length > 0) {
          // If it's an album, pull the first image
          if (res.data.data[0].is_album) {
            // Only gifv and mp4s display on discord.
            // Find the "gifv" property, if that doesnt exist find the "link"
            if (res.data.data[0].images[0].gifv) {
              imageLink = res.data.data[0].images[0].gifv;
            } else {
              imageLink = res.data.data[0].images[0].link;
            }
          } else if (res.data.data[0].gifv) {
            imageLink = res.data.data[0].gifv;
          } else if (res.data.data[0].link) {
            imageLink = res.data.data[0].link;
          }
        } else {
          // log.debug(F, `No results found!`);
          imageLink = `No results found for ${query}!`;
        }

        // log.debug(F, `imageLink: ${imageLink}`);

        resolve(imageLink);
      }).catch((err:Error) => {
        reject(err);
      });
    });
  }

  const results = await searchImgur();
  log.info(F, `response: ${JSON.stringify(results, null, 2)}`);
  return results;
}
