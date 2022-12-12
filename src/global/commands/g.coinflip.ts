import { parse } from 'path';


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
export async function coinflip():Promise<string> {
  // Get a random number between 0 and 1000
  const random = Math.floor(Math.random() * 100);
  let side;

  // Normal, boring, coin flip
  if (random < 50) {
    side = 'Heads!';
  } else {
    side = 'Tails!';
  }

  // Now with /flair/!
  if (random === 0) {
    side = 'The coin slipped into subspace and disappeared?!';
  } else if (random === 1) {
    side = 'The coin landed on its side?!';
  } else if (random === 2) {
    side = 'The coin rolled off the table?!';
  } else if (random === 3) {
    side = `${Math.floor(Math.random() * 6)}! Oh that's a dice...`;
  } else if (random === 4) {
    side = 'The coin kept spinning in the air?!';
  } else if (random === 96) {
    side = 'Some kid came and took your coin!';
  } else if (random === 97) {
    side = `A ${animals[Math.floor(Math.random() * animals.length)]} came and took your coin!`;
  } else if (random === 98) {
    side = 'You refuse to observe the coin so it is both heads and tails!';
  } else if (random === 99) {
    side = `The coin says "${side}!"`;
  } else if (random === 100) {
    side = 'Due to inflation the coin kept floating away!';
  }
  log.info(F, `response: ${JSON.stringify(side, null, 2)}`);

  return side;
}
