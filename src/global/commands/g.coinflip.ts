import { t } from '../../i18n/index';

// Make an array of animal emojis
const animals = [
  '🐌', '🐒', '🐔', '🐗', '🐚', '🐛', '🐜', '🐝', '🐞', '🐤', '🐦', '🐧',
  '🐨', '🐭', '🐮', '🐯', '🐰', '🐱', '🐴', '🐵', '🐶', '🐷', '🐸', '🐹',
  '🐺', '🐻', '🐼', '🦁', '🦄', '🦅', '🦆', '🦇', '🦉', '🦊', '🦋', '🙊',
];

const F = f(__filename);

export default coinflip;

/**
 *
 * @return {string}
 */
export async function coinflip(locale = 'en-US'):Promise<string> {
  // Get a random number between 0 and 1000
  const random = Math.floor(Math.random() * 100);
  // log.debug(F, `random: ${random}`);
  let side;

  // Normal, boring, coin flip
  if (random < 50) {
    side = t(locale, 'coinflip.headsResult');
  } else {
    side = t(locale, 'coinflip.tailsResult');
  }

  // Now with /flair/!
  if (random === 0) {
    side = t(locale, 'coinflip.subspaceResult');
  } else if (random === 1) {
    side = t(locale, 'coinflip.sideResult');
  } else if (random === 2) {
    side = t(locale, 'coinflip.rolledOffResult');
  } else if (random === 3) {
    side = t(locale, 'coinflip.diceResult', { number: Math.floor(Math.random() * 6) });
  } else if (random === 4) {
    side = t(locale, 'coinflip.spinningResult');
  } else if (random === 96) {
    side = t(locale, 'coinflip.kidTookResult');
  } else if (random === 97) {
    side = t(locale, 'coinflip.animalTookResult', { animal: animals[Math.floor(Math.random() * animals.length)] });
  } else if (random === 98) {
    side = t(locale, 'coinflip.bothResult');
  } else if (random === 99) {
    side = t(locale, 'coinflip.coinSaysResult', { side });
  } else if (random === 100) {
    side = t(locale, 'coinflip.floatingResult');
  }
  log.info(F, `response: ${JSON.stringify(side, null, 2)}`);

  return side;
}
