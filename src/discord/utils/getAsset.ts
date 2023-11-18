/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
import fs from 'fs';
import fp from 'path';
import axios from 'axios';
import Canvas from '@napi-rs/canvas';
// import {
//   Client,
// } from 'discord.js';

const F = f(__filename);

// "get the path to this folder, and then join with /assets"
const assetsDirectory = fp.join(fp.dirname(__dirname), 'assets');

const assetDef = {
  nasal_spray_dosage: { path: `${assetsDirectory}/img/nasal_spray_dosage.png`, url: 'https://user-images.githubusercontent.com/1836049/218758611-c84f1e34-0f5b-43ac-90da-bd89b028f131.png' },
  icon_online: { path: `${assetsDirectory}/img/icons/online.png`, url: 'https://i.gyazo.com/cd7b9e018d4818e4b6588cab5d5b019d.png' },
  icon_offline: { path: `${assetsDirectory}/img/icons/offline.png`, url: 'https://i.gyazo.com/b2b1bf7d91acdb4ccc72dfde3d7075fc.png' },
  icon_dnd: { path: `${assetsDirectory}/img/icons/dnd.png`, url: 'https://i.gyazo.com/a98f0e9dd72f6fb59af388d719d01e64.png' },
  icon_idle: { path: `${assetsDirectory}/img/icons/idle.png`, url: 'https://i.gyazo.com/df8f4a4ca2553d4d657ee82e4bf64a3a.png' },
  teamtripsitIcon: { path: `${assetsDirectory}/img/icons/teamtripsit.png`, url: 'https://i.gyazo.com/332b0abef2d223d1a3e6673bcc51681f.png' },
  premiumIcon: { path: `${assetsDirectory}/img/icons/premiumicon.png`, url: 'https://i.gyazo.com/6a76ceef0d0daa3fcb1f893d554f9b5d.png' },
  boosterIcon: { path: `${assetsDirectory}/img/icons/boostericon.png`, url: 'https://i.gyazo.com/8e31c1a660ca0b6c8fe5dc0996f705f8.png' },
  legacyIcon: { path: `${assetsDirectory}/img/icons/legacyicon.png`, url: 'https://i.gyazo.com/0f3fc0132204e80ed5e697e0863cfad3.png' },
  badgeVip0: { path: `${assetsDirectory}/img/badges/vip0.png`, url: 'https://i.gyazo.com/13daebdda4ca75ab59923396f255f7db.png' },
  voiceBar: { path: `${assetsDirectory}/img/voiceBar.png`, url: 'https://i.gyazo.com/f536d9aa1c652fb7d324e918fdab9f60.png' },
  tripsitterBar: { path: `${assetsDirectory}/img/tripsitterBar.png`, url: 'https://i.gyazo.com/66321aeeb7d0a14d7bb5a7a1cfc3bd11.png' },
  developerBar: { path: `${assetsDirectory}/img/developerBar.png`, url: 'https://i.gyazo.com/4eb82654834990b9f3d0471dbd4d2af3.png' },
  teamtripsitBar: { path: `${assetsDirectory}/img/teamtripsitBar.png`, url: 'https://i.gyazo.com/5dd5543cd8c19eb3f28c6b752b525d22.png' },
  badgeVip1: { path: `${assetsDirectory}/img/badges/vip1.png`, url: 'https://i.gyazo.com/5d37a2d3193c4c7e8a033b6b2ed7cb7f.png' },
  badgeVip2: { path: `${assetsDirectory}/img/badges/vip2.png`, url: 'https://i.gyazo.com/161506f23b1907ac1280db26ead5a0a4.png' },
  badgeVip3: { path: `${assetsDirectory}/img/badges/vip3.png`, url: 'https://i.gyazo.com/4bd15a019f7fd5c881e196c38a8b8bf5.png' },
  badgeVip4: { path: `${assetsDirectory}/img/badges/vip4.png`, url: 'https://i.gyazo.com/ca0b1aca00a71a992c196ca0498efef3.png' },
  badgeVip5: { path: `${assetsDirectory}/img/badges/vip5.png`, url: 'https://i.gyazo.com/f614a14051dbc1366ce4de2ead98a519.png' },
  badgeVip6: { path: `${assetsDirectory}/img/badges/vip6.png`, url: 'https://i.gyazo.com/3844d103c034f16e781fd947f593895c.png' },
  badgeVip7: { path: `${assetsDirectory}/img/badges/vip7.png`, url: 'https://i.gyazo.com/0357a63887c1183d53827eb8ebb29ee3.png' },
  badgeVip8: { path: `${assetsDirectory}/img/badges/vip8.png`, url: 'https://i.gyazo.com/693948d030989ffa5bf5e381f471bac6.png' },
  badgeVip9: { path: `${assetsDirectory}/img/badges/vip9.png`, url: 'https://i.gyazo.com/eed9e28789262927cefe0a68b3126ed2.png' },
  badgeVip10: { path: `${assetsDirectory}/img/badges/vip10.png`, url: 'https://i.gyazo.com/4428c08aaf82b7363fb7a327ce27a4c3.png' },
  cardBirthday: { path: `${assetsDirectory}/img/cards/birthday.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  campIconA: { path: `${assetsDirectory}/img/campIconA.png`, url: 'https://i.gyazo.com/62a9db6c42ca3c03cc892b28f5d8b367.png' },
  cardIcons: { path: `${assetsDirectory}/img/cards/icons.png`, url: 'https://i.gyazo.com/1f33cc53c5102c3cbdb751368cb5059c.png' },
  cardLevelIcons: { path: `${assetsDirectory}/img/cards/levelIcons.png`, url: 'https://i.gyazo.com/739f8b68658b9aeeedfb6d5aaf07dc68.png' },
  karmaScale: { path: `${assetsDirectory}/img/cards/karmaScale.png`, url: 'https://i.gyazo.com/8cf140f384aeb61bb2929cccf3d7a8c2.png' },
  karmaContainer: { path: `${assetsDirectory}/img/cards/karmaContainer.png`, url: 'https://i.gyazo.com/4b10b62f315e41d90ee99d6f70c14787.png' },
  karmaFill: { path: `${assetsDirectory}/img/cards/karmaFill.png`, url: 'https://i.gyazo.com/4a5aa5d098e09370e4a257c451c7aaf9.png' },
  // cardBackground: { path: `${assetsDirectory}/img/cards/background.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardBirthdayOverlay: { path: `${assetsDirectory}/img/cards/birthdayOverlay.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardDefault: { path: `${assetsDirectory}/img/cards/default.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardBlack: { path: `${assetsDirectory}/img/cards/black.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardWhite: { path: `${assetsDirectory}/img/cards/white.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardRed: { path: `${assetsDirectory}/img/cards/red.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardGreen: { path: `${assetsDirectory}/img/cards/green.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardBlue: { path: `${assetsDirectory}/img/cards/blue.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardYellow: { path: `${assetsDirectory}/img/cards/yellow.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardPurple: { path: `${assetsDirectory}/img/cards/purple.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardOrange: { path: `${assetsDirectory}/img/cards/orange.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  // cardPink: { path: `${assetsDirectory}/img/cards/pink.png`, url: 'https://i.gyazo.com/b7504ea55bd7935f97b286407a1bc259.png' },
  rules: { path: `${assetsDirectory}/img/RULES.png`, url: 'https://i.imgur.com/lDoNca1.png' },
  Geolines: { path: `${assetsDirectory}/img/backgrounds/Geolines.png`, url: 'https://i.gyazo.com/ac6676009174aed8d3448ca7f3fa9527.png' },
  Waves: { path: `${assetsDirectory}/img/backgrounds/Waves.png`, url: 'https://i.gyazo.com/0ee1fcdf6bba0c56c1fc0183242ef1d2.png' },
  LiquidMaze: { path: `${assetsDirectory}/img/backgrounds/LiquidMaze.png`, url: 'https://i.gyazo.com/53fef2a3554806d2a28690e0d03712a2.png' },
  Flow: { path: `${assetsDirectory}/img/backgrounds/Flow.png`, url: 'https://i.gyazo.com/419d2747174841b24ae9ac1144a6883c.png' },
  DiamondChevron: { path: `${assetsDirectory}/img/backgrounds/DiamondChevron.png`, url: 'https://i.gyazo.com/9be521230698f12838ecbc5935c5268e.png' },
  Concentric: { path: `${assetsDirectory}/img/backgrounds/Concentric.png`, url: 'https://i.gyazo.com/d184006c216f7544c0c765c3a7e37271.png' },
  CubeTunnels: { path: `${assetsDirectory}/img/backgrounds/CubeTunnels.png`, url: 'https://i.gyazo.com/61b6f4ed14553270e3c5435eae283b51.png' },
  Leaves: { path: `${assetsDirectory}/img/backgrounds/Leaves.png`, url: 'https://i.gyazo.com/7527be8a5854b75caec7e1cdb794b300.png' },
  SquareTwist: { path: `${assetsDirectory}/img/backgrounds/SquareTwist.png`, url: 'https://i.gyazo.com/7dcfdeb70b490caea8790a7fd7e782fc.png' },
  Noise: { path: `${assetsDirectory}/img/backgrounds/Noise.png`, url: 'https://i.gyazo.com/1b35950d37b615f17db34125ade35032.png' },
  Squiggles: { path: `${assetsDirectory}/img/backgrounds/Squiggles.png`, url: 'https://i.gyazo.com/6589c130fc34a9ad5c5a832c7363a239.png' },
  TriangleOverlap: { path: `${assetsDirectory}/img/backgrounds/TriangleOverlap.png`, url: 'https://i.gyazo.com/29c2a9b3854400d506e1d9667cf6aacd.png' },
  XandO: { path: `${assetsDirectory}/img/backgrounds/XandO.png`, url: 'https://i.gyazo.com/69d3fe4a19706c751379ee5adf921d86.png' },
  Safari: { path: `${assetsDirectory}/img/backgrounds/Safari.png`, url: 'https://i.gyazo.com/227d02f04fb9c8d42d0360ac35f86760.png' },
  LineLeaves: { path: `${assetsDirectory}/img/backgrounds/LineLeaves.png`, url: 'https://i.gyazo.com/bf935014d3cb15c9db49d79cb6b607a9.png' },
  ArcadeCarpet: { path: `${assetsDirectory}/img/backgrounds/ArcadeCarpet.png`, url: 'https://i.gyazo.com/830242c2c3c3c7f82e36ac365713e9dd.png' },
  Topography: { path: `${assetsDirectory}/img/backgrounds/Topography.png`, url: 'https://i.gyazo.com/9b56026718c39e0a85d1d7544128da35.png' },
  CoffeeSwirl: { path: `${assetsDirectory}/img/backgrounds/CoffeeSwirl.png`, url: 'https://i.gyazo.com/98448b6fb548456d328900d6483938fe.png' },
  SpaceIcons: { path: `${assetsDirectory}/img/backgrounds/SpaceIcons.png`, url: 'https://i.gyazo.com/42174b547ed80c906d84d861abc4230b.png' },
  Plaid: { path: `${assetsDirectory}/img/backgrounds/Plaid.png`, url: 'https://i.gyazo.com/542d40ff3492a0b80f9ffdd7d610ad3e.png' },
  Paisley: { path: `${assetsDirectory}/img/backgrounds/Paisley.png`, url: 'https://i.gyazo.com/83272fc39086a6ccf994d4e8a4f432b9.png' },
  AbstractTriangles: { path: `${assetsDirectory}/img/backgrounds/AbstractTriangles.png`, url: 'https://i.gyazo.com/41194844db3ad5929f919b3b8f922f9c.png' },
  Memphis: { path: `${assetsDirectory}/img/backgrounds/Memphis.png`, url: 'https://i.gyazo.com/6b08f0dad9dcf36c458071496d6052d3.png' },
  Connected: { path: `${assetsDirectory}/img/backgrounds/Connected.png`, url: 'https://i.gyazo.com/8a948ed8bff1f7377dbbd12d3c467d78.png' },
  CircuitBoard: { path: `${assetsDirectory}/img/backgrounds/CircuitBoard.png`, url: 'https://i.gyazo.com/4bbba848e8351342480563ab118dccaa.png' },
  Dissociating: { path: `${assetsDirectory}/img/backgrounds/Dissociating.png`, url: 'https://i.gyazo.com/969c0b7a31fc24fb0e4b3e07a0609e58.png' },
  DotnDash: { path: `${assetsDirectory}/img/backgrounds/DotnDash.png`, url: 'https://i.gyazo.com/01e6c58a9a5e7aa1723b7f1b353536aa.png' },
  Drunk: { path: `${assetsDirectory}/img/backgrounds/Drunk.png`, url: 'https://i.gyazo.com/b19df7b88170d8b9aea4e3755d17442a.png' },
  Halftone: { path: `${assetsDirectory}/img/backgrounds/Halftone.png`, url: 'https://i.gyazo.com/746492feb876d89b47b587a11c99cd7e.png' },
  High: { path: `${assetsDirectory}/img/backgrounds/High.png`, url: 'https://i.gyazo.com/ce784d66c81e190b3439b8057183d56b.png' },
  Mindsets: { path: `${assetsDirectory}/img/backgrounds/Mindsets.png`, url: 'https://i.gyazo.com/e57ca09564d15878eb3dd2fa5e8e7f46.png' },
  PixelCamo: { path: `${assetsDirectory}/img/backgrounds/PixelCamo.png`, url: 'https://i.gyazo.com/269728ae29ec5d8de62e697ed6b51580.png' },
  Rolling: { path: `${assetsDirectory}/img/backgrounds/Rolling.png`, url: 'https://i.gyazo.com/59e9fb8897bc2e8eeda1562d5cc1ec1b.png' },
  Sedated: { path: `${assetsDirectory}/img/backgrounds/Sedated.png`, url: 'https://i.gyazo.com/54f6b48bb33523b14b8b97960d14060f.png' },
  Sprinkles: { path: `${assetsDirectory}/img/backgrounds/Sprinkles.png`, url: 'https://i.gyazo.com/c7fda9a04850bfc504e2a9fe895045f6.png' },
  Stimming: { path: `${assetsDirectory}/img/backgrounds/Stimming.png`, url: 'https://i.gyazo.com/78c8675c2113502b8feb9f715b5279da.png' },
  Tripping: { path: `${assetsDirectory}/img/backgrounds/Tripping.png`, url: 'https://i.gyazo.com/4dc61d4745de62fea7a61188bb77c096.png' },
  Emoticons: { path: `${assetsDirectory}/img/backgrounds/Emoticons.png`, url: 'https://i.gyazo.com/898db3d481c303f4c38d74973d5e4a14.png' },
  Equations: { path: `${assetsDirectory}/img/backgrounds/Equations.png`, url: 'https://i.gyazo.com/561e9cd1ca3b02608c7f9e5f1908d6d9.png' },
  Flowers: { path: `${assetsDirectory}/img/backgrounds/Flowers.png`, url: 'https://i.gyazo.com/2e1d47f128305b2f12fe2c4bb7db75d2.png' },
  Paws: { path: `${assetsDirectory}/img/backgrounds/Paws.png`, url: 'https://i.gyazo.com/83b9f275af87372edc610da449220a4c.png' },
  mushroomInfoA: { path: `${assetsDirectory}/img/mushroomInfoA.png`, url: 'https://i.gyazo.com/233df47085a0ac5493d8378111512b3d.png' },
  mushroomInfoB: { path: `${assetsDirectory}/img/mushroomInfoB.png`, url: 'https://i.gyazo.com/2aae45e843da99867b82e9b1ad07d22b.png' },
  Acme: { path: `${assetsDirectory}/font/Acme.woff2`, url: 'https://fonts.gstatic.com/s/acme/v25/RrQfboBx-C5_XxrBbg.woff2' },
  Agbalumo: { path: `${assetsDirectory}/font/Agbalumo.woff2`, url: 'https://fonts.gstatic.com/s/agbalumo/v2/55xvey5uMdT2N37KZfMCgLg.woff2' },
  Lobster: { path: `${assetsDirectory}/font/Lobster.woff2`, url: 'https://fonts.gstatic.com/s/lobster/v30/neILzCirqoswsqX9zoKmMw.woff2' },
  AbrilFatFace: { path: `${assetsDirectory}/font/AbrilFatFace.woff2`, url: 'https://fonts.gstatic.com/s/abrilfatface/v23/zOL64pLDlL1D99S8g8PtiKchq-dmjQ.woff2' },
  Satisfy: { path: `${assetsDirectory}/font/Satisfy.woff2`, url: 'https://fonts.gstatic.com/s/satisfy/v21/rP2Hp2yn6lkG50LoCZOIHQ.woff2' },
  IndieFlower: { path: `${assetsDirectory}/font/IndieFlower.woff2`, url: 'https://fonts.gstatic.com/s/indieflower/v21/m8JVjfNVeKWVnh3QMuKkFcZVaUuH.woff2' },
  BlackOpsOne: { path: `${assetsDirectory}/font/BlackOpsOne.woff2`, url: 'https://fonts.gstatic.com/s/blackopsone/v20/qWcsB6-ypo7xBdr6Xshe96H3aDvbtw.woff2' },
  LilitaOne: { path: `${assetsDirectory}/font/LilitaOne.woff2`, url: 'https://fonts.gstatic.com/s/lilitaone/v15/i7dPIFZ9Zz-WBtRtedDbYEF8RQ.woff2' },
  PressStart2P: { path: `${assetsDirectory}/font/PressStart2P.woff2`, url: 'https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2' },
  Creepster: { path: `${assetsDirectory}/font/Creepster.woff2`, url: 'https://fonts.gstatic.com/s/creepster/v13/AlZy_zVUqJz4yMrniH4Rcn35.woff2' },
  SpecialElite: { path: `${assetsDirectory}/font/SpecialElite.woff2`, url: 'https://fonts.gstatic.com/s/specialelite/v18/XLYgIZbkc4JPUL5CVArUVL0ntnAOSA.woff2' },
  AudioWide: { path: `${assetsDirectory}/font/AudioWide.woff2`, url: 'https://fonts.gstatic.com/s/audiowide/v20/l7gdbjpo0cum0ckerWCdlg_O.woff2' },
  CabinSketch: { path: `${assetsDirectory}/font/CabinSketch.woff2`, url: 'https://fonts.gstatic.com/s/cabinsketch/v21/QGY2z_kZZAGCONcK2A4bGOj0I_1Y5tjz.woff2' },
  Rye: { path: `${assetsDirectory}/font/Rye.woff2`, url: 'https://fonts.gstatic.com/s/rye/v15/r05XGLJT86YzEZ7t.woff2' },
  FontdinerSwanky: { path: `${assetsDirectory}/font/FontdinerSwanky.woff2`, url: 'https://fonts.gstatic.com/s/fontdinerswanky/v23/ijwOs4XgRNsiaI5-hcVb4hQgMvCD0uYVKw.woff2' },
  Barcode: { path: `${assetsDirectory}/font/Barcode.woff2`, url: 'https://fonts.gstatic.com/s/librebarcode39/v21/-nFnOHM08vwC6h8Li1eQnP_AHzI2G_Bx0g.woff2' },
} as {
  [key: string]: { path: string;
    url: string;
  };
};

export async function downloadAsset(
  url:string,
  filepath:string,
):Promise<void> {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  log.debug(F, `Saving ${url} to ${filepath}`);

  const directoryPath = fp.dirname(filepath);

  // Check if the directory exists
  if (!fs.existsSync(directoryPath)) {
    // Create the directory recursively
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    response.data.pipe(fs.createWriteStream(filepath))
      .on('error', (err:Error) => {
        log.error(F, `Error saving ${url} to ${filepath}`);
        reject(err);
      })
      .once('close', () => {
        log.debug(F, `Saved ${url} to ${filepath}`);
        resolve();
      });
  });
}

export default async function getAsset(
  assetName: string,
): Promise<string> {
  // This function will use imageName to look up the data in the imageDef object
  // It will use that information and check the path to see if the imageName exists at that location
  // If it does not exist, it will download it from the internet and save it to that location
  // Either way, it will return a working path to the image
  const { path, url } = assetDef[assetName];
  // log.debug(F, `Checking ${path}`);
  if (!fs.existsSync(path)) {
    // log.debug(F, `Downloading ${url} to ${path}`);
    await downloadAsset(url, path);

    // If it's a font, register it to canvas
    if (path.includes('.woff2')) {
      Canvas.GlobalFonts.registerFromPath(path, assetName);
      log.debug(F, `Registered ${assetName} to canvas`);
    }
  }

  return path;
}
