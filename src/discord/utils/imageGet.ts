/* eslint-disable no-unused-vars */
import fs from 'fs';
import axios from 'axios';
// import {
//   Client,
// } from 'discord.js';

const F = f(__filename);

export default imageGet;

const imageDef = {
  rules: {
    path: './src/discord/assets/img/RULES_test.png',
    url: 'https://i.imgur.com/lDoNca1.png',
  },
} as {
  [key: string]: {
    path: string;
    url: string;
  };
};

export async function imageGet(
  imageName: 'rules',
): Promise<string> {
  // This function will use imageName to look up the data in the imageDef object
  // It will use that information and check the path to see if the imageName exists at that location
  // If it does not exist, it will download it from the internet and save it to that location
  // Either way, it will return a working path to the image
  const { path, url } = imageDef[imageName];
  log.debug(F, `Checking ${path}`);
  if (!fs.existsSync(path)) {
    log.debug(F, `Downloading ${url} to ${path}`);
    await downloadImage(url, path);
  }
  return path;
}

export async function downloadImage(
  url:string,
  filepath:string,
):Promise<void> {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    response.data.pipe(fs.createWriteStream(filepath))
      .on('error', reject)
      .once('close', () => resolve());
  });
}
