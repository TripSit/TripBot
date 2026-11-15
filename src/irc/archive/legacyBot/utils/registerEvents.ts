import fs from 'fs/promises';
import path from 'path';

export default async function registerEvents(): Promise<void> {
  const eventFolder = path.join(__dirname, '../events');
  const eventFiles = await fs.readdir(eventFolder);
  eventFiles
    .filter(file => file.endsWith('.ts')
      && !file.endsWith('index.ts')
      && !file.endsWith('_i.template.ts'))
    // eslint-disable-next-line global-require, import/no-dynamic-require
    .map(file => require(`../events/${file}`))
    .forEach(event => {
      event.execute();
    });
}
