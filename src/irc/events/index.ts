import { Client } from 'irc-framework';
import { registerIrcBridge } from '../bridge';
import registerPrivmsg from './privmsg';

export default function registerEvents(client: Client): void {
  registerPrivmsg(client);
  registerIrcBridge(client);
}
