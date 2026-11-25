import type { ChatInputCommandInteraction } from 'discord.js';
import commandContext from '../../utils/context';

describe('commandContext', () => {
  it('omits the Discord user ID from command logs', async () => {
    const context = await commandContext({
      user: { id: 'private-user-id' },
      guild: { name: 'Test Guild' },
    } as unknown as ChatInputCommandInteraction);

    expect(context).toContain('Test Guild');
    expect(context).not.toContain('private-user-id');
  });
});
