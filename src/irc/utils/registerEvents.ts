import fs from 'fs/promises';
// import logger from '../../global/utils/logger';
import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
*/
export async function registerEvents(): Promise<void> {
  const eventFolder = path.join(__dirname, '../events');
  const eventFiles = await fs.readdir(eventFolder);
  // logger.debug(`[${PREFIX}] eventFiles: ${JSON.stringify(eventFiles, null, 2)}`);
  eventFiles
    .filter((file) => file.endsWith('.ts') &&
      !file.endsWith('index.ts') &&
      !file.endsWith('_i.template.ts'))
    .map((file) => require(`../events/${file}`))
    .forEach((event) => {
      // logger.debug(`[${PREFIX}] event: ${JSON.stringify(event, null, 2)}`);
      event.execute();
    });
};
