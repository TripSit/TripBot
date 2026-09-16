import { EventEmitter } from 'events';
import type { Client } from 'irc-framework';
import registerPrivmsg from '../../events/privmsg';

const BOT_NICK = 'TripBotDev';
const CHANNEL = '#lounge';

let client: EventEmitter & { user: { nick: string }; say: ReturnType<typeof vi.fn> };

function send(nick: string, target: string, message: string) {
  client.emit('privmsg', {
    nick, target, message, ident: 'u', hostname: 'h', from_server: false, tags: {},
  });
}

beforeEach(() => {
  client = Object.assign(new EventEmitter(), { user: { nick: BOT_NICK }, say: vi.fn() });
  registerPrivmsg(client as unknown as Client);
  vi.spyOn(global.log, 'debug').mockReturnValue(undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('privmsg commands', () => {
  it('runs echo in the channel it was sent to', () => {
    send('someone', CHANNEL, '!echo hello there');
    expect(client.say).toHaveBeenCalledWith(CHANNEL, 'hello there');
  });

  it('replies to the sender for private messages', () => {
    send('someone', BOT_NICK, '!echo hi');
    expect(client.say).toHaveBeenCalledWith('someone', 'hi');
  });

  it('matches command names case-insensitively', () => {
    send('someone', CHANNEL, '!ECHO hi');
    expect(client.say).toHaveBeenCalledWith(CHANNEL, 'hi');
  });

  it('ignores unknown commands and ordinary messages', () => {
    send('someone', CHANNEL, '!weather tomorrow');
    send('someone', CHANNEL, 'echo hello');
    expect(client.say).not.toHaveBeenCalled();
  });

  it('ignores its own messages', () => {
    send(BOT_NICK, CHANNEL, '!echo loop');
    expect(client.say).not.toHaveBeenCalled();
  });

  it('uses the configured prefix', () => {
    const originalPrefix = env.IRC_BOTPREFIX;
    env.IRC_BOTPREFIX = '~';
    try {
      send('someone', CHANNEL, '!echo old');
      send('someone', CHANNEL, '~echo new');
    } finally {
      env.IRC_BOTPREFIX = originalPrefix;
    }
    expect(client.say.mock.calls).toEqual([[CHANNEL, 'new']]);
  });
});
