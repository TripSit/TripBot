// Make an array of animal emojis
const animals = [
  '🐌',
  '🐒',
  '🐔',
  '🐗',
  '🐚',
  '🐛',
  '🐜',
  '🐝',
  '🐞',
  '🐤',
  '🐦',
  '🐧',
  '🐨',
  '🐭',
  '🐮',
  '🐯',
  '🐰',
  '🐱',
  '🐴',
  '🐵',
  '🐶',
  '🐷',
  '🐸',
  '🐹',
  '🐺',
  '🐻',
  '🐼',
  '🦁',
  '🦄',
  '🦅',
  '🦆',
  '🦇',
  '🦉',
  '🦊',
  '🦋',
  '🙊',
];

const F = f(__filename);

export default coinflip;

/**
 *
 * @return {string}
 */
export async function coinflip(): Promise<string> {
  // Get a random number between 0 and 1000
  const random = Math.floor(Math.random() * 100);
  // log.debug(F, `random: ${random}`);
  let side;

  // Normal, boring, coin flip
  side = random < 50 ? 'Heads!' : 'Tails!';

  // Now with /flair/!
  switch (random) {
    case 0: {
      side = 'The coin slipped into subspace and disappeared?!';

      break;
    }
    case 1: {
      side = 'The coin landed on its side?!';

      break;
    }
    case 2: {
      side = 'The coin rolled off the table?!';

      break;
    }
    case 3: {
      side = `${Math.floor(Math.random() * 6)}! Oh that's a dice...`;

      break;
    }
    case 4: {
      side = 'The coin kept spinning in the air?!';

      break;
    }
    case 96: {
      side = 'Some kid came and took your coin!';

      break;
    }
    case 97: {
      side = `A ${animals[Math.floor(Math.random() * animals.length)]} came and took your coin!`;

      break;
    }
    case 98: {
      side = 'You refuse to observe the coin so it is both heads and tails!';

      break;
    }
    case 99: {
      side = `The coin says "${side}!"`;

      break;
    }
    case 100: {
      side = 'Due to inflation the coin kept floating away!';

      break;
    }
    // No default
  }
  log.info(F, `response: ${JSON.stringify(side, null, 2)}`);

  return side;
}
