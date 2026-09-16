import { Client } from 'irc-framework';

export default function echo(client: Client, target: string, args: string): void {
  client.say(target, args.length > 0 ? args : `Usage: ${env.IRC_BOTPREFIX}echo <text>`);
}
