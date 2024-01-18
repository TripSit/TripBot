import Canvas from '@napi-rs/canvas';

export function resizeText(canvas: Canvas.Canvas, text: string, startingSize: number, textFont: string, maxLength: number): string {
  const context = canvas.getContext('2d');
  let fontSize = startingSize;
  do {
    fontSize -= 1;
    context.font = `${fontSize}px ${textFont}`;
  } while (context.measureText(text).width > maxLength);
  return context.font;
}

const normalAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const fancyAlphabets = [
  Array.from('𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃'),
  Array.from('𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏'),
  Array.from('𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷'),
  Array.from('𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟'),
  Array.from('𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫'),
  Array.from('ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'),
  Array.from('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ'),
  Array.from('🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉'),
  Array.from('ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'),
  Array.from('ค๒ς๔єŦﻮђเןкɭ๓ภ๏קợгรՇยשฬאץչค๒ς๔єŦﻮђเןкɭ๓ภ๏קợгรՇยשฬאץչ'),
  Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZαႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥ'),
  Array.from('ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ'),
  Array.from('ᏗᏰፈᎴᏋᎦᎶᏂᎥᏠᏦᏝᎷᏁᎧᎮᎤᏒᏕᏖᏬᏉᏇጀᎩፚᏗᏰፈᎴᏋᎦᎶᏂᎥᏠᏦᏝᎷᏁᎧᎮᎤᏒᏕᏖᏬᏉᏇጀᎩፚ'),
  Array.from('ąცƈɖɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬų۷ῳҳყʑąცƈɖɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬų۷ῳҳყʑ'),
  Array.from('ค๖¢໓ēfງhiวkl๓ຖ໐p๑rŞtนงຟxฯຊค๖¢໓ēfງhiวkl๓ຖ໐p๑rŞtนงຟxฯຊ'),
  Array.from('𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳'),
  Array.from('𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻'),
  Array.from('𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯'),
  Array.from('𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣'),
  Array.from('ΛBᄃDΣFGΉIJKᄂMПӨPQЯƧƬЦVЩXYZΛBᄃDΣFGΉIJKᄂMПӨPQЯƧƬЦVЩXYZ'),
  Array.from('αв¢∂єƒgнιנкℓмησρqяѕтυνωχуzαв¢∂єƒgнιנкℓмησρqяѕтυνωχуz'),
  Array.from('ÄßÇÐÈ£GHÌJKLMñÖþQR§†ÚVW×¥Zåß¢Ðê£ghïjklmñðþqr§†µvwx¥z'),
  Array.from('₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ'),
  Array.from('Ⱥβ↻ᎠƐƑƓǶįلҠꝈⱮហටφҨའϚͲԱỼచჯӋɀąҍçժҽƒցհìʝҟӀʍղօքզɾʂէմѵա×վՀ'),
  Array.from('ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭YᘔᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ'),
  Array.from('ᗩᗷᑢᕲᘿᖴᘜᕼᓰᒚᖽᐸᒪᘻᘉᓍᕵᕴᖇSᖶᑘᐺᘺ᙭ᖻᗱᗩᗷᑢᕲᘿᖴᘜᕼᓰᒚᖽᐸᒪᘻᘉᓍᕵᕴᖇSᖶᑘᐺᘺ᙭ᖻᗱ'),
];

export function deFuckifyText(text: string): string {
  const normalAlphabetArray = Array.from(normalAlphabet);
  return Array.from(text).map(char => {
    if (/^[\x20-\x7E]$/g.test(char)) {
      return char;
    }
    for (let i = 0; i < fancyAlphabets.length; i += 1) {
      const index = fancyAlphabets[i].indexOf(char);
      if (index !== -1) {
        return normalAlphabetArray[index];
      }
    }
    if (normalAlphabet.includes(char)) {
      return char;
    }
    return '';
  }).join('');
}

export const colorDefs = {
  [env.ROLE_PURPLE]: {
    cardDarkColor: '#19151e',
    cardLightColor: '#2d2636',
    chipColor: '#47335f',
    barColor: '#9661d9',
    textColor: '#b072ff',
  },
  [env.ROLE_BLUE]: {
    cardDarkColor: '#161d1f',
    cardLightColor: '#283438',
    chipColor: '#3a5760',
    barColor: '#4baccc',
    textColor: '#5acff5',
  },
  [env.ROLE_GREEN]: {
    cardDarkColor: '#151a16',
    cardLightColor: '#252e28',
    chipColor: '#31543d',
    barColor: '#59b879',
    textColor: '#6de194',
  },
  [env.ROLE_PINK]: {
    cardDarkColor: '#1e151b',
    cardLightColor: '#352530',
    chipColor: '#5f324f',
    barColor: '#d95dae',
    textColor: '#ff6dcd',
  },
  [env.ROLE_RED]: {
    cardDarkColor: '#1f1616',
    cardLightColor: '#382727',
    chipColor: '#613838',
    barColor: '#d95152',
    textColor: '#ff5f60',
  },
  [env.ROLE_ORANGE]: {
    cardDarkColor: '#1d1814',
    cardLightColor: '#342b24',
    chipColor: '#5f422e',
    barColor: '#d98b51',
    textColor: '#ffa45f',
  },
  [env.ROLE_YELLOW]: {
    cardDarkColor: '#1d1b14',
    cardLightColor: '#333024',
    chipColor: '#5e532d',
    barColor: '#d6b94e',
    textColor: '#ffdd5d',
  },
  [env.ROLE_WHITE]: {
    cardDarkColor: '#242424',
    cardLightColor: '#404040',
    chipColor: '#666666',
    barColor: '#b3b3b3',
    textColor: '#dadada',
  },
  [env.ROLE_DONOR_BLACK]: {
    cardDarkColor: '#0e0e0e',
    cardLightColor: '#181818',
    chipColor: '#262626',
    barColor: '#595959',
    textColor: '#626262',
  },
  [env.ROLE_DONOR_PURPLE]: {
    cardDarkColor: '#1a1222',
    cardLightColor: '#272235',
    chipColor: '#432767',
    barColor: '#7f38d9',
    textColor: '#9542ff',
  },
  [env.ROLE_DONOR_BLUE]: {
    cardDarkColor: '#0c171d',
    cardLightColor: '#1b2830',
    chipColor: '#2f4f5f',
    barColor: '#1da2cc',
    textColor: '#22bef0',
  },
  [env.ROLE_DONOR_GREEN]: {
    cardDarkColor: '#0f1f12',
    cardLightColor: '#203827',
    chipColor: '#275c39',
    barColor: '#36b360',
    textColor: '#45e47b',
  },
  [env.ROLE_DONOR_PINK]: {
    cardDarkColor: '#25141c',
    cardLightColor: '#412438',
    chipColor: '#682b52',
    barColor: '#d93fa4',
    textColor: '#ff4ac1',
  },
  [env.ROLE_DONOR_RED]: {
    cardDarkColor: '#210e0e',
    cardLightColor: '#3e211f',
    chipColor: '#662526',
    barColor: '#d93335',
    textColor: '#ff3c3e',
  },
  [env.ROLE_DONOR_ORANGE]: {
    cardDarkColor: '#211710',
    cardLightColor: '#3f2c20',
    chipColor: '#664225',
    barColor: '#d96c36',
    textColor: '#ff913b',
  },
  [env.ROLE_DONOR_YELLOW]: {
    cardDarkColor: '#211e0f',
    cardLightColor: '#3d361f',
    chipColor: '#655721',
    barColor: '#d9bc4f',
    textColor: '#ffd431',
  },
} as {
  [key: string]: {
    cardDarkColor: string;
    cardLightColor: string;
    chipColor: string;
    barColor: string;
    textColor: string;
  };
};
