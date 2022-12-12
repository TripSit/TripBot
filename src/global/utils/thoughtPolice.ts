//
// import log from './logger';
// import {parse} from 'path';
// const F = f(__filename);

const _ = { // eslint-disable-line
  A: '[a|A|🅰|4|@]+',
  B: '[b|B|🅱]+',
  C: '(c|C|🅲|k|ck|q)+',
  D: '[d|D|🅳]+',
  E: '[e|E|🅴|3|$]+',
  F: '(f|F|🅵|ph)+',
  G: '[g|G|🅶|🅱]+',
  H: '[h|H|🅷]+',
  I: '[i|I|🅸|1|!]+',
  J: '[j|J|🅹]+',
  K: '[k|K|🅺]+',
  L: '[l|L|🅻|1|!]+',
  M: '[m|M|🅼]+',
  N: '[n|N|🅽]+',
  O: '[o|O|🅾|0|@]+',
  P: '[p|P|🅿]+',
  Q: '[q|Q|🆀]+',
  R: '[r|R|🆁]+',
  S: '[s|S|🆂|5|$]+',
  T: '[t|T|🆃|7]+',
  U: '[u|U|🆄|v]+',
  V: '[v|V|🆅|u]+',
  W: '[w|W|🆆|v|v]+',
  X: '[x|X|🆇]+',
  Y: '[y|Y|🆈]+',
  Z: '[z|Z|🆉|5|$]+',
  one: '[1|1️⃣!|¡]+',
  two: '[2|2️⃣]+',
  thr: '[3|3️⃣|£|E]+',
  fou: '[4|4️⃣|A]+',
  fiv: '[5|5️⃣|S]+',
  six: '[6|6️⃣|G]+',
  sev: '[7|7️⃣|T]+',
  eig: '[8|8️⃣|*|O|0]+',
  nin: '[9|9️⃣|q]+',
  zer: '[0|0️⃣|O|o]+',
};

// const s = env.NODE_ENV === 'production' ? '\\\\W*' : '\\W*';

const s = '\\W*';

const offensive = [
  /* beasteality */[_.B, _.E, _.A, _.S, _.T, _.E, _.A, _.L, _.I, _.T, _.Y].join(s),
  /* bitch */[_.B, _.I, _.T, _.C, _.H].join(s),
  /* coon */[_.C, _.O, _.O, _.N].join(s),
  /* cunt */[_.C, _.U, _.N, _.T].join(s),
  /* dyke */[_.D, _.Y, _.K, _.E].join(s),
  /* eskimo */[_.E, _.S, _.K, _.I, _.M, _.O].join(s),
  /* fag */[_.F, _.A, _.G].join(s),
  /* gay */[_.G, _.A, _.Y].join(s),
  /* heil */[_.H, _.E, _.I, _.L].join(s),
  /* hitler */[_.H, _.I, _.T, _.L, _.E, _.R].join(s),
  /* hoe */[_.H, _.O, _.E].join(s),
  /* nazi */[_.N, _.A, _.Z, _.I].join(s),
  /* nigga */[_.N, _.I, _.G, _.G, _.A].join(s),
  /* nigger */[_.N, _.I, _.G, _.G, _.E, _.R].join(s),
  /* niglet */[_.N, _.I, _.G, _.L, _.E, _.T].join(s),
  /* rape */[_.R, _.A, _.P, _.E].join(s),
  /* rapist */[_.R, _.A, _.P, _.I, _.S, _.T].join(s),
  /* raping */[_.R, _.A, _.P, _.I, _.N, _.G].join(s),
  /* reeree */[_.R, _.E, _.E, _.R, _.E, _.E].join(s),
  /* slut */[_.S, _.L, _.U, _.T].join(s),
  /* tard */[_.T, _.A, _.R, _.D].join(s),
  /* tranny */[_.T, _.R, _.A, _.N, _.N, _.Y].join(s),
  /* whore */[_.W, _.H, _.O, _.R, _.E].join(s),
  /* 1488 */[_.one, _.fou, _.eig, _.eig].join(s),
];

const harmReduction = [
  /* suicide */[_.S, _.U, _.I, _.C, _.I, _.D, _.E].join(s),
  /* overdose */[_.O, _.V, _.E, _.R, _.D, _.O, _.S, _.E].join(s),
  /* ems */[_.E, _.M, _.S].join(s),
  /* kms */[_.K, _.M, _.S].join(s),
];

const hornyJail = [
  /* blowjob */[_.B, _.L, _.O, _.W, _.J, _.O, _.B].join(s),
  /* clit */[_.C, _.L, _.I, _.T].join(s),
  /* cock */[_.C, _.O, _.C, _.K].join(s),
  // /* condom */[_.C, _.O, _.N, _.D, _.O, _.M].join(s),
  /* cum */[_.C, _.U, _.M].join(s),
  /* cuck */[_.C, _.U, _.C, _.K].join(s),
  /* cunilingus */[_.C, _.U, _.N, _.I, _.L, _.I, _.N, _.G, _.U, _.S].join(s),
  /* cyberfuck */[_.C, _.Y, _.B, _.E, _.R, _.F, _.U, _.C, _.K].join(s),
  /* dick */[_.D, _.I, _.C, _.K].join(s),
  /* dildo */[_.D, _.I, _.L, _.D, _.O].join(s),
  /* ejacul */[_.E, _.J, _.A, _.C, _.U, _.L].join(s),
  /* felatio */[_.F, _.E, _.L, _.A, _.T, _.I, _.O].join(s),
  /* gangbang */[_.G, _.A, _.N, _.G, _.B, _.A, _.N, _.G].join(s),
  /* horny */[_.H, _.O, _.R, _.N, _.Y].join(s),
  /* jackoff */[_.J, _.A, _.C, _.K, _.O, _.F, _.F].join(s),
  /* jerkoff */[_.J, _.E, _.R, _.K, _.O, _.F, _.F].join(s),
  /* jizz */[_.J, _.I, _.Z, _.Z].join(s),
  /* masturbate */[_.M, _.A, _.S, _.T, _.U, _.R, _.B, _.A, _.T, _.E].join(s),
  /* orgasm */[_.O, _.R, _.G, _.A, _.S, _.M].join(s),
  /* penis */[_.P, _.E, _.N, _.I, _.S].join(s),
  /* porn */[_.P, _.O, _.R, _.N].join(s), // porn
  /* prick */[_.P, _.R, _.I, _.C, _.K].join(s),
  /* pussy */[_.P, _.U, _.S, _.S, _.Y].join(s),
  /* pussie */[_.P, _.U, _.S, _.S, _.I, _.E].join(s),
  /* sex */[_.S, _.E, _.X].join(s), // sex
  /* smut */[_.S, _.M, _.U, _.T].join(s),
  /* spunk */[_.S, _.P, _.U, _.N, _.K].join(s),
  /* twat */[_.T, _.W, _.A, _.T].join(s),
];

const pg13 = [
  // /* ass */ [_.A, _.S, _.S].join(s),
  // /* asshole */[_.A, _.S, _.S, _.H, _.O, _.L, _.E].join(s),
  /* bastard */[_.B, _.A, _.S, _.T, _.A, _.R, _.D].join(s),
  // /* damn */[_.D, _.A, _.M, _.N].join(s),
  // /* fuck */[_.F, _.U, _.C, _.K].join(s),
  /* homo */[_.H, _.O, _.M, _.O].join(s),
  /* jew */[_.J, _.E, _.W].join(s),
  /* murder */ [_.M, _.U, _.R, _.D, _.E, _.R].join(s),
  // /* piss */[_.P, _.I, _.S, _.S].join(s),
  /* queer */[_.Q, _.U, _.E, _.E, _.R].join(s),
  /* retard */[_.R, _.E, _.T, _.A, _.R, _.D].join(s), // Some drugs have "retard" (slow) in their name
  // /* shit */[_.S, _.H, _.I, _.T].join(s),
];

const memes = [
  /* yolo */[_.Y, _.O, _.L, _.O].join(s),
  /* jenkum */[_.J, _.E, _.N, _.K, _.E, _.M].join(s),
  /* blazeit */[_.B, _.L, _.A, _.Z, _.E, _.I, _.T].join(s),
  /* swag */[_.S, _.W, _.A, _.G].join(s),
];

export default bigBrother;

/**
 * This runs on every message to determine if a badword is used
 * @param {string} messageContent Message to scan
 * @return {Promise<void>}
 */
export async function bigBrother(messageContent:string): Promise<string> {
  // log.debug(F, `messageContent: ${JSON.stringify(messageContent, null, 2)}!`);

  // Check for most offensive stuff first
  if (offensive.filter(pattern => new RegExp(pattern).test(messageContent)).length > 0) {
    return 'offensive';
  }

  // Check for HR alerts next
  if (harmReduction.filter(pattern => new RegExp(pattern).test(messageContent)).length > 0) {
    return 'harm';
  }

  // Check for horny people next
  if (hornyJail.filter(pattern => new RegExp(pattern).test(messageContent)).length > 0) {
    return 'horny';
  }

  // Check for uncouth language
  if (pg13.filter(pattern => new RegExp(pattern).test(messageContent)).length > 0) {
    return 'pg13';
  }

  // Check for memes next
  if (memes.filter(pattern => new RegExp(pattern).test(messageContent)).length > 0) {
    return 'meme';
  }

  return 'none';
}
