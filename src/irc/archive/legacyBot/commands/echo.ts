import { Message } from 'matrix-org-irc';

const F = f(__filename);

export default async function echo(message:Message): Promise<void> {
  log.debug(F, 'start!');
  // Split out the command and the rest of the message
  const text = message.args[1].split(' ');
  // Remove the first element in the array because it's the command name
  text.shift();
  // Rejoin the rest of the message
  const result = text.join(' ');
  // Send the message back to the channel
  global.ircClient.say(message.args[0], result);
}
