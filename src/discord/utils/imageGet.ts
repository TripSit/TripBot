/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
import fs from 'fs';
import axios from 'axios';
// import {
//   Client,
// } from 'discord.js';

// const F = f(__filename);

export default imageGet;

export async function imageGet(
  imageName: string,
): Promise<string> {
  // This function will use imageName to look up the data in the imageDef object
  // It will use that information and check the path to see if the imageName exists at that location
  // If it does not exist, it will download it from the internet and save it to that location
  // Either way, it will return a working path to the image
  const { path, url } = imageDef[imageName];
  // log.debug(F, `Checking ${path}`);
  if (!fs.existsSync(path)) {
    // log.debug(F, `Downloading ${url} to ${path}`);
    await downloadImage(url, path);
  } else {
    // log.debug(F, `Found ${path}`);
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

const imageDef = {
  nasal_spray_dosage: { path: './src/discord/assets/img/nasal_spray_dosage.png', url: 'https://user-images.githubusercontent.com/1836049/218758611-c84f1e34-0f5b-43ac-90da-bd89b028f131.png' },
  icon_online: { path: './src/discord/assets/img/icons/online.png', url: 'https://i.gyazo.com/cd7b9e018d4818e4b6588cab5d5b019d.png' },
  icon_offline: { path: './src/discord/assets/img/icons/offline.png', url: 'https://i.gyazo.com/b2b1bf7d91acdb4ccc72dfde3d7075fc.png' },
  icon_dnd: { path: './src/discord/assets/img/icons/dnd.png', url: 'https://i.gyazo.com/a98f0e9dd72f6fb59af388d719d01e64.png' },
  icon_idle: { path: './src/discord/assets/img/icons/idle.png', url: 'https://i.gyazo.com/df8f4a4ca2553d4d657ee82e4bf64a3a.png' },
  badgeVip0: { path: './src/discord/assets/img/badges/vip0.png', url: 'https://i.gyazo.com/13daebdda4ca75ab59923396f255f7db.png' },
  badgeVip1: { path: './src/discord/assets/img/badges/vip1.png', url: 'https://i.gyazo.com/5d37a2d3193c4c7e8a033b6b2ed7cb7f.png' },
  badgeVip2: { path: './src/discord/assets/img/badges/vip2.png', url: 'https://i.gyazo.com/161506f23b1907ac1280db26ead5a0a4.png' },
  badgeVip3: { path: './src/discord/assets/img/badges/vip3.png', url: 'https://i.gyazo.com/4bd15a019f7fd5c881e196c38a8b8bf5.png' },
  badgeVip4: { path: './src/discord/assets/img/badges/vip4.png', url: 'https://i.gyazo.com/ca0b1aca00a71a992c196ca0498efef3.png' },
  badgeVip5: { path: './src/discord/assets/img/badges/vip5.png', url: 'https://i.gyazo.com/f614a14051dbc1366ce4de2ead98a519.png' },
  badgeVip6: { path: './src/discord/assets/img/badges/vip6.png', url: 'https://i.gyazo.com/3844d103c034f16e781fd947f593895c.png' },
  badgeVip7: { path: './src/discord/assets/img/badges/vip7.png', url: 'https://i.gyazo.com/0357a63887c1183d53827eb8ebb29ee3.png' },
  badgeVip8: { path: './src/discord/assets/img/badges/vip8.png', url: 'https://i.gyazo.com/693948d030989ffa5bf5e381f471bac6.png' },
  badgeVip9: { path: './src/discord/assets/img/badges/vip9.png', url: 'https://i.gyazo.com/eed9e28789262927cefe0a68b3126ed2.png' },
  badgeVip10: { path: './src/discord/assets/img/badges/vip10.png', url: 'https://i.gyazo.com/4428c08aaf82b7363fb7a327ce27a4c3.png' },
  cardBirthday: { path: './src/discord/assets/img/cards/birthday.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  campIconA: { path: './src/discord/assets/img/campIconA.png', url: 'https://i.gyazo.com/62a9db6c42ca3c03cc892b28f5d8b367.png' },
  cardIcons: { path: './src/discord/assets/img/cards/icons.png', url: 'https://i.gyazo.com/6669a36a7adf68996354bd7586cd7083.png' },
  cardLevelIcons: { path: './src/discord/assets/img/cards/levelIcons.png', url: 'https://i.gyazo.com/69d030886df6d0d260e2a293a6bc7894.png' },
  // cardBackground: { path: './src/discord/assets/img/cards/background.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardBirthdayOverlay: { path: './src/discord/assets/img/cards/birthdayOverlay.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardDefault: { path: './src/discord/assets/img/cards/default.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardBlack: { path: './src/discord/assets/img/cards/black.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardWhite: { path: './src/discord/assets/img/cards/white.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardRed: { path: './src/discord/assets/img/cards/red.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardGreen: { path: './src/discord/assets/img/cards/green.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardBlue: { path: './src/discord/assets/img/cards/blue.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardYellow: { path: './src/discord/assets/img/cards/yellow.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardPurple: { path: './src/discord/assets/img/cards/purple.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardOrange: { path: './src/discord/assets/img/cards/orange.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardPink: { path: './src/discord/assets/img/cards/pink.png', url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
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
