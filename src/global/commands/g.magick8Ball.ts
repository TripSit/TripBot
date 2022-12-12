const F = f(__filename);

const answers = [
  'It is certain',
  'It is decidedly so',
  'Without a doubt',
  'Yes definitely',
  'You may rely on it',
  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',
  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  'Don\'t count on it',
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtfull',
];

export default magick8Ball;

/**
 *
 * @return {string} What the 8ball says
 */
export async function magick8Ball():Promise<string> {
  const response = answers[Math.floor(Math.random() * answers.length)];
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
