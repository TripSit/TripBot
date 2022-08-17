'use strict';

// eslint-disable no-multi-spaces

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');
const logger = require('./logger');

const _ = {
  A: '[a|🅰|4|@]+',
  B: '[b|🅱]+',
  C: '(c|🅲|k|ck|q)+',
  D: '[d|🅳]+',
  E: '[e|🅴|3|$]+',
  F: '(f|🅵|ph)+',
  G: '[g|🅶|🅱]+',
  H: '[h|🅷]+',
  I: '[i|🅸|1|!]+',
  J: '[j|🅹]+',
  K: '[k|🅺]+',
  L: '[l|🅻|1|!]+',
  M: '[m|🅼]+',
  N: '[n|🅽]+',
  O: '[o|🅾|0|@]+',
  P: '[p|🅿]+',
  Q: '[q|🆀]+',
  R: '[r|🆁]+',
  S: '[s|🆂|5|$]+',
  T: '[t|🆃|7]+',
  U: '[u|🆄|v]+',
  V: '[v|🆅|u]+',
  W: '[w|🆆|v|v]+',
  X: '[x|🆇]+',
  Y: '[y|🆈]+',
  Z: '[z|🆉|5|$]+',
};

const pg13 = [
  [_.A, _.S, _.S].join(''), // ass
  [_.A, _.S, _.S, _.H, _.O, _.L, _.E].join(''), // asshole
  [_.B, _.A, _.S, _.T, _.A, _.R, _.D].join(''), // bastard
  [_.D, _.A, _.M, _.N].join(''), // damn
  [_.F, _.U, _.C, _.K].join(''), // fuck
  [_.P, _.I, _.S, _.S].join(''), // piss
  [_.S, _.H, _.I, _.T].join(''), // shit
];

const harmReduction = [
  [_.S, _.U, _.I, _.C, _.I, _.D, _.E].join(''), // suicide
  [_.O, _.V, _.E, _.R, _.D, _.O, _.S, _.E].join(''), // overdose
  [_.E, _.M, _.S].join(''), // EMS
  [_.K, _.M, _.S].join(''), // KMS (kill myself)
];

const hornyJail = [
  [_.B, _.L, _.O, _.W, _.J, _.O, _.B].join(''),
  [_.C, _.L, _.I, _.T].join(''),
  [_.C, _.O, _.C, _.K].join(''),
  [_.C, _.O, _.N, _.D, _.O, _.M].join(''),
  [_.C, _.U, _.M].join(''),
  [_.C, _.U, _.N, _.I, _.L, _.I, _.N, _.G, _.U, _.S].join(''),
  [_.C, _.Y, _.B, _.E, _.R, _.F, _.U, _.C, _.K].join(''),
  [_.D, _.I, _.C, _.K].join(''),
  [_.D, _.I, _.L, _.D, _.O].join(''),
  [_.E, _.J, _.A, _.C, _.U, _.L].join(''),
  [_.F, _.E, _.L, _.A, _.T, _.I, _.O].join(''),
  [_.G, _.A, _.N, _.G, _.B, _.A, _.N, _.G].join(''),
  [_.H, _.O, _.R, _.N, _.Y].join(''),
  [_.J, _.A, _.C, _.K, _.O, _.F, _.F].join(''),
  [_.J, _.E, _.R, _.K, _.O, _.F, _.F].join(''),
  [_.J, _.I, _.Z, _.Z].join(''),
  [_.M, _.A, _.S, _.T, _.U, _.R, _.B, _.A, _.T, _.E].join(''),
  [_.O, _.R, _.G, _.A, _.S, _.M].join(''),
  [_.P, _.E, _.N, _.I, _.S].join(''),
  [_.P, _.O, _.R, _.N].join(''), // porn
  [_.P, _.R, _.I, _.C, _.K].join(''),
  [_.P, _.U, _.S, _.S, _.Y].join(''),
  [_.P, _.U, _.S, _.S, _.I, _.E].join(''),
  [_.S, _.E, _.X].join(''), // sex
  [_.S, _.M, _.U, _.T].join(''),
  [_.S, _.P, _.U, _.N, _.K].join(''),
  [_.T, _.W, _.A, _.T].join(''),
];

const memes = [
  [_.Y, _.O, _.L, _.O].join(''),
  [_.J, _.E, _.N, _.K, _.E, _.M].join(''),
  [_.B, _.L, _.A, _.Z, _.E, _.I, _.T].join(''),
  [_.S, _.W, _.A, _.G].join(''),
];

const offensive = [
  [_.B, _.E, _.A, _.S, _.T, _.E, _.A, _.L, _.I, _.T, _.Y].join(''),
  [_.B, _.I, _.T, _.C, _.H].join(''), // bitch
  [_.C, _.O, _.O, _.N].join(''),
  [_.C, _.U, _.N, _.T].join(''),
  [_.D, _.Y, _.K, _.E].join(''),
  [_.E, _.S, _.K, _.I, _.M, _.O].join(''),
  [_.F, _.A, _.G].join(''),
  [_.G, _.A, _.Y].join(''),
  [_.H, _.E, _.I, _.L].join(''),
  [_.H, _.I, _.T, _.L, _.E, _.R].join(''),
  [_.H, _.O, _.E].join(''),
  [_.H, _.O, _.M, _.O].join(''),
  [_.J, _.E, _.W].join(''),
  [_.N, _.A, _.Z, _.I].join(''),
  [_.N, _.I, _.G, _.G, _.A].join(''),
  [_.N, _.I, _.G, _.G, _.E, _.R].join(''),
  [_.N, _.I, _.G, _.L, _.E, _.T].join(''),
  [_.Q, _.U, _.E, _.E, _.R].join(''),
  [_.R, _.A, _.P, _.E].join(''),
  [_.R, _.A, _.P, _.I, _.S, _.T].join(''),
  [_.R, _.A, _.P, _.I, _.N, _.G].join(''),
  [_.R, _.E, _.T, _.A, _.R, _.D].join(''),
  [_.R, _.E, _.T, _.A, _.R, _.D].join(''),
  [_.R, _.E, _.E, _.R, _.E, _.E].join(''),
  [_.S, _.L, _.U, _.T].join(''),
  [_.T, _.A, _.R, _.D].join(''),
  [_.T, _.R, _.A, _.N, _.N, _.Y].join(''),
  [_.W, _.H, _.O, _.R, _.E].join(''),
  [1488].join(''),
];

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
