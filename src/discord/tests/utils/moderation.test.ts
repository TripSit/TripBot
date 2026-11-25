/* eslint-disable sonarjs/no-duplicate-string */
import { EmbedBuilder } from 'discord.js';
import type { Message, MessageReaction, User } from 'discord.js';
import { paginationEmbed } from '../../utils/pagination';
import { thoughtPolice } from '../../utils/thoughtPolice';
import { chitragupta } from '../../utils/chitragupta';
import { dbMock } from '../../../vitest/utils/mockDb';

describe('paginationEmbed', () => {
  const pages = () => [new EmbedBuilder().setTitle('a'), new EmbedBuilder().setTitle('b'), new EmbedBuilder().setTitle('c')];

  function setup(deferred = true) {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const collector = { on: vi.fn((event: string, fn: (...args: unknown[]) => unknown) => { handlers[event] = fn; }), resetTimer: vi.fn() };
    const message = { createMessageComponentCollector: vi.fn(() => collector), edit: vi.fn(async () => undefined) };
    const interaction = { deferred, deferReply: vi.fn(), editReply: vi.fn(async () => message) };
    return {
      interaction, handlers, collector, message,
    };
  }
  const click = (customId: string) => ({ customId, deferUpdate: vi.fn(), editReply: vi.fn() });

  it('defers when needed and renders the first page with a counter', async () => {
    const { interaction } = setup(false);
    await paginationEmbed(interaction as never, pages(), 1000, true);
    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 });
    const [{ embeds }] = interaction.editReply.mock.calls[0] as unknown as [{ embeds: EmbedBuilder[] }];
    expect(embeds[0].data.footer?.text).toBe('Page 1 / 3');
  });

  it('does not defer twice, and defers publicly by default', async () => {
    const already = setup(true);
    await paginationEmbed(already.interaction as never, pages());
    expect(already.interaction.deferReply).not.toHaveBeenCalled();
    const fresh = setup(false);
    await paginationEmbed(fresh.interaction as never, pages());
    expect(fresh.interaction.deferReply).toHaveBeenCalledWith({ flags: undefined });
  });

  it('wraps around when paging in either direction', async () => {
    const { interaction, handlers, collector } = setup();
    await paginationEmbed(interaction as never, pages());
    const footerAfter = async (id: string) => {
      const i = click(id);
      await handlers.collect(i);
      const [{ embeds }] = i.editReply.mock.calls[0] as unknown as [{ embeds: EmbedBuilder[] }];
      return embeds[0].data.footer?.text;
    };
    expect(await footerAfter('previousButton')).toBe('Page 3 / 3');
    expect(await footerAfter('nextButton')).toBe('Page 1 / 3');
    expect(await footerAfter('nextButton')).toBe('Page 2 / 3');
    expect(await footerAfter('previousButton')).toBe('Page 1 / 3');
    expect(await footerAfter('unrelated')).toBe('Page 1 / 3');
    expect(collector.resetTimer).toHaveBeenCalledTimes(5);
  });

  it('only collects the pagination buttons', async () => {
    const { interaction, message } = setup();
    await paginationEmbed(interaction as never, pages());
    const { filter } = (message.createMessageComponentCollector.mock.calls[0] as unknown as [{ filter: (i: unknown) => boolean }])[0];
    expect(filter({ customId: 'previousButton' })).toBe(true);
    expect(filter({ customId: 'nextButton' })).toBe(true);
    expect(filter({ customId: 'x' })).toBe(false);
  });

  it('disables the buttons when the collector ends, unless the message was deleted', async () => {
    const { interaction, handlers, message } = setup();
    await paginationEmbed(interaction as never, pages());
    handlers.end(null, 'time');
    expect(message.edit).toHaveBeenCalledTimes(1);
    message.edit.mockRejectedValueOnce(new Error('Unknown Message'));
    handlers.end(null, 'time');
    handlers.end(null, 'messageDelete');
    expect(message.edit).toHaveBeenCalledTimes(2);
  });

  // Regression test for TripSit/TripBot#1361: the buttons used to be shared, so one session ending disabled the next
  it('starts every session with active buttons, even after an earlier session ended', async () => {
    const buttonStates = (interaction: { editReply: { mock: { calls: unknown[][] } } }) => {
      const [{ components }] = interaction.editReply.mock.calls[0] as unknown as [
        { components: Array<{ toJSON: () => { components: Array<{ disabled?: boolean }> } }> },
      ];
      return components[0].toJSON().components.map(button => button.disabled === true);
    };
    const first = setup();
    await paginationEmbed(first.interaction as never, pages());
    expect(buttonStates(first.interaction)).toEqual([false, false]);
    first.handlers.end(null, 'time');
    const [{ components }] = first.message.edit.mock.calls[0] as unknown as [
      { components: Array<{ toJSON: () => { components: Array<{ disabled?: boolean }> } }> },
    ];
    expect(components[0].toJSON().components.map(button => button.disabled)).toEqual([true, true]);

    const second = setup();
    await paginationEmbed(second.interaction as never, pages());
    expect(buttonStates(second.interaction)).toEqual([false, false]);
  });
});

describe('thoughtPolice', () => {
  function setup(content: string, modlog: unknown = { send: vi.fn() }) {
    const channelSend = vi.fn();
    const message = {
      cleanContent: content,
      delete: vi.fn(),
      member: { displayName: 'Ally' },
      channel: { send: channelSend, name: 'lounge' },
      client: { channels: { fetch: vi.fn(async () => modlog) } },
    };
    return {
      message: message as unknown as Message, channelSend, modlog: modlog as { send: ReturnType<typeof vi.fn> } | null, raw: message,
    };
  }

  it('removes offensive messages, reminds the channel and informs the mods', async () => {
    const {
      message, raw, channelSend, modlog,
    } = setup('NAZI');
    await thoughtPolice(message);
    expect(raw.delete).toHaveBeenCalled();
    expect(channelSend).toHaveBeenCalledWith(expect.stringContaining('non-offensive language'));
    expect(modlog?.send).toHaveBeenCalledWith({
      content: expect.stringContaining('Ally said "NAZI" in lounge'),
      allowedMentions: { parse: [] },
    });
  });

  it('copes with a missing mod log channel', async () => {
    const { message, channelSend } = setup('nazi', null);
    await thoughtPolice(message);
    expect(channelSend).toHaveBeenCalled();
  });

  it('leaves everything else alone', async () => {
    const { message, raw, channelSend } = setup('hello friends');
    await thoughtPolice(message);
    expect(raw.delete).not.toHaveBeenCalled();
    expect(channelSend).not.toHaveBeenCalled();
  });
});

describe('chitragupta', () => {
  const user = { id: 'actor' } as User;
  const reaction = (over: Record<string, unknown> = {}) => ({
    message: { author: { id: 'target' } }, emoji: { name: 'upvote' }, ...over,
  }) as unknown as MessageReaction;

  it('records karma given and received', async () => {
    await chitragupta(reaction(), user, 1);
    expect(dbMock.users.upsert).toHaveBeenCalledTimes(2);
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { discord_id: 'actor' }, update: { karma_given: { increment: 1 } },
    }));
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { discord_id: 'target' }, create: expect.objectContaining({ karma_received: 1 }),
    }));
  });

  it('reverses karma on removal', async () => {
    await chitragupta(reaction({ emoji: { name: 'ts_upvote' } }), user, -1);
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: { karma_received: { increment: -1 } },
    }));
  });

  it.each([
    ['no author', { message: { author: null } }],
    ['no emoji name', { emoji: { name: null } }],
    ['other emoji', { emoji: { name: 'heart' } }],
  ])('ignores %s', async (_label, over) => {
    await chitragupta(reaction(over), user, 1);
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });

  it('ignores self-karma', async () => {
    await chitragupta(reaction({ message: { author: user } }), user, 1);
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });
});
