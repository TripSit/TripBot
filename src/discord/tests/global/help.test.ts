import { dHelp, helpMenu } from '../../commands/global/d.help';
import { slashStub } from '../../../vitest/utils/commandStubs';

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));

describe('help', () => {
  it('opens on the start page', async () => {
    const stub = slashStub();
    expect(await dHelp.execute(stub as never)).toBe(true);
    const reply = stub.editReply.mock.calls[0][0] as { embeds: Array<{ data: { title: string } }>; components: unknown[] };
    expect(reply.embeds[0].data.title).toContain('Welcome to TripSit');
    expect(reply.components).toHaveLength(1);
  });

  it.each([
    'Start', 'HarmReduction', 'Systems', 'Fun', 'TripSit', 'TripSitExp', 'TripSitOnly', 'Support', 'Credits', 'Feedback', 'Invite', 'unknown',
  ])('menu page %s renders an embed without exceeding embed limits', async value => {
    const interaction = { values: [value], update: vi.fn() };
    await helpMenu(interaction as never);
    expect(interaction.update).toHaveBeenCalledTimes(1);
    const page = interaction.update.mock.calls[0][0] as { embeds: Array<{ data: { title?: string; description?: string; fields?: unknown[] } }> };
    expect(page.embeds.length).toBeGreaterThan(0);
    page.embeds.forEach(embed => {
      expect((embed.data.description ?? '').length).toBeLessThanOrEqual(4096);
      expect((embed.data.fields ?? []).length).toBeLessThanOrEqual(25);
    });
  });
});
