import { Client, MessageEvent } from 'irc-framework';
import echo from '../commands/echo';

const F = f(__filename);

type IrcCommand = (client: Client, target: string, args: string) => void;

const commands: Record<string, IrcCommand> = {
  echo,
};

export default function registerPrivmsg(client: Client): void {
  client.on('privmsg', ({ nick, target, message }: MessageEvent) => {
    if (nick === client.user.nick || !message.startsWith(env.IRC_BOTPREFIX)) return;

    const [name, ...rest] = message.slice(env.IRC_BOTPREFIX.length).split(' ');
    // Other bots share the prefix, so unknown commands are ignored rather than answered
    const command = commands[name.toLowerCase()];
    if (!command) return;

    // Channel commands reply in the channel; private messages reply to the sender
    const replyTo = target === client.user.nick ? nick : target;
    log.debug(F, `${nick} ran ${env.IRC_BOTPREFIX}${name} in ${replyTo}`);
    command(client, replyTo, rest.join(' ').trim());
  });
}
