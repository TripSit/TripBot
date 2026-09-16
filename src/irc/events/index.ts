import { Client } from 'irc-framework';
import registerPrivmsg from './privmsg';

export default function registerEvents(client: Client): void {
  registerPrivmsg(client);
}
