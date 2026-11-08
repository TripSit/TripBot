import type { Client } from 'irc-framework';
import echo from '../../commands/echo';

const say = vi.fn();
const client = { say } as unknown as Client;

describe('echo', () => {
  it('repeats the text back to the target', () => {
    echo(client, '#lounge', 'hello there');
    expect(say).toHaveBeenCalledWith('#lounge', 'hello there');
  });

  it('shows usage when there is nothing to echo', () => {
    echo(client, 'someone', '');
    expect(say).toHaveBeenCalledWith('someone', 'Usage: !echo <text>');
  });
});
