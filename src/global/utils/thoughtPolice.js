'use strict';

// eslint-disable no-multi-spaces

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');
const logger = require('./logger');

const _ = {
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

const s = '\\\\W*';

const pg13 = [
  [_.A, _.S, _.S].join(s), // ass
  [_.A, _.S, _.S, _.H, _.O, _.L, _.E].join(s), // asshole
  [_.B, _.A, _.S, _.T, _.A, _.R, _.D].join(s), // bastard
  [_.D, _.A, _.M, _.N].join(s), // damn
  [_.F, _.U, _.C, _.K].join(s), // fuck
  [_.P, _.I, _.S, _.S].join(s), // piss
  [_.S, _.H, _.I, _.T].join(s), // shit
];

const harmReduction = [
  [_.S, _.U, _.I, _.C, _.I, _.D, _.E].join(s), // suicide
  [_.O, _.V, _.E, _.R, _.D, _.O, _.S, _.E].join(s), // overdose
  [_.E, _.M, _.S].join(s), // EMS
  [_.K, _.M, _.S].join(s), // KMS (kill myself)
];

const hornyJail = [
  [_.B, _.L, _.O, _.W, _.J, _.O, _.B].join(s),
  [_.C, _.L, _.I, _.T].join(s),
  [_.C, _.O, _.C, _.K].join(s),
  [_.C, _.O, _.N, _.D, _.O, _.M].join(s),
  [_.C, _.U, _.M].join(s),
  [_.C, _.U, _.N, _.I, _.L, _.I, _.N, _.G, _.U, _.S].join(s),
  [_.C, _.Y, _.B, _.E, _.R, _.F, _.U, _.C, _.K].join(s),
  [_.D, _.I, _.C, _.K].join(s),
  [_.D, _.I, _.L, _.D, _.O].join(s),
  [_.E, _.J, _.A, _.C, _.U, _.L].join(s),
  [_.F, _.E, _.L, _.A, _.T, _.I, _.O].join(s),
  [_.G, _.A, _.N, _.G, _.B, _.A, _.N, _.G].join(s),
  [_.H, _.O, _.R, _.N, _.Y].join(s),
  [_.J, _.A, _.C, _.K, _.O, _.F, _.F].join(s),
  [_.J, _.E, _.R, _.K, _.O, _.F, _.F].join(s),
  [_.J, _.I, _.Z, _.Z].join(s),
  [_.M, _.A, _.S, _.T, _.U, _.R, _.B, _.A, _.T, _.E].join(s),
  [_.O, _.R, _.G, _.A, _.S, _.M].join(s),
  [_.P, _.E, _.N, _.I, _.S].join(s),
  [_.P, _.O, _.R, _.N].join(s), // porn
  [_.P, _.R, _.I, _.C, _.K].join(s),
  [_.P, _.U, _.S, _.S, _.Y].join(s),
  [_.P, _.U, _.S, _.S, _.I, _.E].join(s),
  [_.S, _.E, _.X].join(s), // sex
  [_.S, _.M, _.U, _.T].join(s),
  [_.S, _.P, _.U, _.N, _.K].join(s),
  [_.T, _.W, _.A, _.T].join(s),
];

const memes = [
  [_.Y, _.O, _.L, _.O].join(s),
  [_.J, _.E, _.N, _.K, _.E, _.M].join(s),
  [_.B, _.L, _.A, _.Z, _.E, _.I, _.T].join(s),
  [_.S, _.W, _.A, _.G].join(s),
];

const offensive = [
  [_.B, _.E, _.A, _.S, _.T, _.E, _.A, _.L, _.I, _.T, _.Y].join(s),
  [_.B, _.I, _.T, _.C, _.H].join(s), // bitch
  [_.C, _.O, _.O, _.N].join(s),
  [_.C, _.U, _.N, _.T].join(s),
  [_.D, _.Y, _.K, _.E].join(s),
  [_.E, _.S, _.K, _.I, _.M, _.O].join(s),
  [_.F, _.A, _.G].join(s),
  [_.G, _.A, _.Y].join(s),
  [_.H, _.E, _.I, _.L].join(s),
  [_.H, _.I, _.T, _.L, _.E, _.R].join(s),
  [_.H, _.O, _.E].join(s),
  [_.H, _.O, _.M, _.O].join(s),
  [_.J, _.E, _.W].join(s),
  [_.N, _.A, _.Z, _.I].join(s),
  [_.N, _.I, _.G, _.G, _.A].join(s),
  [_.N, _.I, _.G, _.G, _.E, _.R].join(s),
  [_.N, _.I, _.G, _.L, _.E, _.T].join(s),
  [_.Q, _.U, _.E, _.E, _.R].join(s),
  [_.R, _.A, _.P, _.E].join(s),
  [_.R, _.A, _.P, _.I, _.S, _.T].join(s),
  [_.R, _.A, _.P, _.I, _.N, _.G].join(s),
  [_.R, _.E, _.T, _.A, _.R, _.D].join(s),
  [_.R, _.E, _.E, _.R, _.E, _.E].join(s),
  [_.S, _.L, _.U, _.T].join(s),
  [_.T, _.A, _.R, _.D].join(s),
  [_.T, _.R, _.A, _.N, _.N, _.Y].join(s),
  [_.W, _.H, _.O, _.R, _.E].join(s),
  [_.one, _.fou, _.eig, _.eig].join(s),
];

logger.debug(`[${PREFIX}]`);
offensive.forEach(word => {
  logger.debug(`${word}`);
});

module.exports = {
  async bigBrother(messageContent) {
    logger.debug(`[${PREFIX}] started!`);
    logger.debug(`[${PREFIX}] messageContent: ${JSON.stringify(messageContent, null, 2)}!`);

    // Check for most offensive stuff first
    const offensiveMatch = offensive.filter(
      pattern => new RegExp(pattern).test(messageContent),
    ).length > 0;
    if (offensiveMatch) {
      return ['offensive', stripIndents`
      As a reminder to everyone: We have a lot of people currently in an altered mindset.
      Please use inclusive language so we can all have a good time, thank you for cooperating!
      `];
    }

    // Check for HR alerts next
    const hrMatch = harmReduction.filter(
      pattern => {
        logger.debug(`[${PREFIX}] pattern: ${pattern}`);
        return new RegExp(pattern).test(messageContent);
      },
    ).length > 0;
    if (hrMatch) {
      return ['harm', ''];
    }

    // Check for horny people next
    const hornyMatch = hornyJail.filter(
      pattern => new RegExp(pattern).test(messageContent),
    ).length > 0;
    if (hornyMatch) {
      return ['horny', 'We\'re all adults here, but this isn\'t really a place to talk about that. Maybe try #adult-swim?'];
    }

    // Check for memes next
    const memeMatch = memes.filter(
      pattern => new RegExp(pattern).test(messageContent),
    ).length > 0;
    if (memeMatch) {
      const memeResponses = [
        'Never heard that one before! 😂😂',
        'Did you come up with that?? 😂😂',
        'LOOOOOL that\'s a good one LMAO!! 😂😂',
        'OMG do you do stand-up?? 😂😂',
        'Aww, that\'s nice dear 🙂',
      ];
      // get random meme response
      const randomMemeResponse = memeResponses[Math.floor(Math.random() * memeResponses.length)];
      return ['meme', randomMemeResponse];
    }

    // Check for uncouth language
    const pgMatch = pg13.filter(
      pattern => new RegExp(pattern).test(messageContent),
    ).length > 0;
    if (pgMatch) {
      // return ['pg13', stripIndents`
      // As a reminder to everyone: We have a lot of people currently in an altered mindset.
      // Please use inclusive language so we can all have a good time, thank you for cooperating!
      // `];
      return ['pg13', ''];
    }
  },
};
