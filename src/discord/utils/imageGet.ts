/* eslint-disable no-unused-vars */
import fs from 'fs';
import axios from 'axios';
// import {
//   Client,
// } from 'discord.js';

const F = f(__filename);

export default imageGet;

const imageDef = {
  rules: { path: './src/discord/assets/img/RULES.png', url: 'https://i.imgur.com/lDoNca1.png' },
  Geolines: { path: './src/discord/assets/img/backgrounds/Geolines.png', url: 'https://drive.google.com/uc?export=view&id=1-CpMlbe77hgdlh6thqwvMwXuUl_ozgEi' },
  Waves: { path: './src/discord/assets/img/backgrounds/Waves.png', url: 'https://drive.google.com/uc?export=view&id=1-OScueAsW13QcyjTs9UsX5LO3VR0hIn8' },
  LiquidMaze: { path: './src/discord/assets/img/backgrounds/LiquidMaze.png', url: 'https://drive.google.com/uc?export=view&id=1-RdKRSH1rrugei5VLHHjUdXceBhDPnPn' },
  Flow: { path: './src/discord/assets/img/backgrounds/Flow.png', url: 'https://drive.google.com/uc?export=view&id=1-ZkGk_lw2zEX1xVxXzwhjum7UOJBwDGb' },
  DiamondChevron: { path: './src/discord/assets/img/backgrounds/DiamondChevron.png', url: 'https://drive.google.com/uc?export=view&id=1-b2xFDrzpL6tVMvmY5pz-SO-czPnCMsO' },
  Chevron: { path: './src/discord/assets/img/backgrounds/Chevron.png', url: 'https://drive.google.com/uc?export=view&id=1-c3XYW0A6lvYo9MFAi_cHSF6v2csInVU' },
  Concentric: { path: './src/discord/assets/img/backgrounds/Concentric.png', url: 'https://drive.google.com/uc?export=view&id=1-fe72RxbCLR24QOwomtsZcetTnsP1zNx' },
  CubeTunnels: { path: './src/discord/assets/img/backgrounds/CubeTunnels.png', url: 'https://drive.google.com/uc?export=view&id=1-fvG30yPMAK87d0JeKEND8CMB80xhP4_' },
  Leaves: { path: './src/discord/assets/img/backgrounds/Leaves.png', url: 'https://drive.google.com/uc?export=view&id=1-rQG0lQOfI30DOSZAOQGBoYi7FXxgqbg' },
  SquareTwist: { path: './src/discord/assets/img/backgrounds/SquareTwist.png', url: 'https://drive.google.com/uc?export=view&id=103ok01PPBQlpfeqQO30D8waE1db30nBY' },
  SquareSpiral: { path: './src/discord/assets/img/backgrounds/SquareSpiral.png', url: 'https://drive.google.com/uc?export=view&id=106GkajsYXQyG_VARHT_cdv-olUmPToni' },
  Noise: { path: './src/discord/assets/img/backgrounds/Noise.png', url: 'https://drive.google.com/uc?export=view&id=10Glmw04_aNLo0h-YsZcgmg5PUU_hQ5Yt' },
  Squiggles: { path: './src/discord/assets/img/backgrounds/Squiggles.png', url: 'https://drive.google.com/uc?export=view&id=10J5CZyaBq9zBO4GDsIg2wayw3aIPlkZC' },
  TriangleOverlap: { path: './src/discord/assets/img/backgrounds/TriangleOverlap.png', url: 'https://drive.google.com/uc?export=view&id=10LoWmB0HhGxzRlguftb0vwiqfM06BaVF' },
  XandO: { path: './src/discord/assets/img/backgrounds/XandO.png', url: 'https://drive.google.com/uc?export=view&id=10_MmlrVO5jEmrWWyt-voVFTrZ7YE0Vik' },
  Safari: { path: './src/discord/assets/img/backgrounds/Safari.png', url: 'https://drive.google.com/uc?export=view&id=10_P_iPx6sgljCycEA1qcNbK8mLdcAcf-' },
  LineLeaves: { path: './src/discord/assets/img/backgrounds/LineLeaves.png', url: 'https://drive.google.com/uc?export=view&id=10c7AWo3qseXKQLU6Iwd0h_xX4GfVWwiJ' },
  ArcadeCarpet: { path: './src/discord/assets/img/backgrounds/ArcadeCarpet.png', url: 'https://drive.google.com/uc?export=view&id=10i4iS2sJBxOSX6LDrx8bc3qeeJ30hGP9' },
  Topography: { path: './src/discord/assets/img/backgrounds/Topography.png', url: 'https://drive.google.com/uc?export=view&id=10nMZEZc5IQGbWiOVhThb1jt6BGjev_HO' },
  CoffeeSwirl: { path: './src/discord/assets/img/backgrounds/CoffeeSwirl.png', url: 'https://drive.google.com/uc?export=view&id=10pCnwM8aZXxVpXGN1LYNwSDNm3citRXP' },
  SpaceIcons: { path: './src/discord/assets/img/backgrounds/SpaceIcons.png', url: 'https://drive.google.com/uc?export=view&id=11-aqVuO-qGh1aFayml_tNQdZuVLF3lgj' },
  Plaid: { path: './src/discord/assets/img/backgrounds/Plaid.png', url: 'https://drive.google.com/uc?export=view&id=112ezKc-zpb0p3iwVYujw5lK2Cgp8uTzS' },
  Paisley: { path: './src/discord/assets/img/backgrounds/Paisley.png', url: 'https://drive.google.com/uc?export=view&id=114risNKm8Khc3uRqRlpB9MsT6qypt4ag' },
  AbstractTriangles: { path: './src/discord/assets/img/backgrounds/AbstractTriangles.png', url: 'https://drive.google.com/uc?export=view&id=116zugUVQJqTVEhSZTO8iXiiLUznrOjjc' },
  Memphis: { path: './src/discord/assets/img/backgrounds/Memphis.png', url: 'https://drive.google.com/uc?export=view&id=117XLPb59h6V9op7GG7A6FFSvh07Any7-' },
  Connected: { path: './src/discord/assets/img/backgrounds/Connected.png', url: 'https://drive.google.com/uc?export=view&id=11AVKT7xrjI2ZgIpxz7j0zstBkD6XOD4m' },
  Binary: { path: './src/discord/assets/img/backgrounds/Binary.png', url: 'https://drive.google.com/uc?export=view&id=11Ocm9oq5jCqnWleZEZyk9yPsdSpQl6oK' },
} as {
  [key: string]: { path: string;
    url: string;
  };
};

export async function imageGet(
  imageName: string,
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
