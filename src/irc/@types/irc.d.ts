export type IRCMessage = {
  args: string[];
  prefix: string;
  nick: string;
  user: string;
  host: string;
  command: 'PRIVMSG' | 'JOIN' | 'PART' | 'KICK' | 'NICK' | 'QUIT' | 'KILL';
  rawCommand: 'PRIVMSG' | 'JOIN' | 'PART' | 'KICK' | 'NICK' | 'QUIT' | 'KILL';
  commandType: 'normal';
};
