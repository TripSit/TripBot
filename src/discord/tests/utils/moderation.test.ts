/* eslint-disable sonarjs/no-duplicate-string */
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';
import type { Message, MessageReaction, User } from 'discord.js';
import { paginationEmbed } from '../../utils/pagination';
import { thoughtPolice } from '../../utils/thoughtPolice';
import { isToxic, monitorToxicity } from '../../utils/moderateHatespeech';
import { chitragupta } from '../../utils/chitragupta';
import { dbMock } from '../../../vitest/utils/mockDb';

vi.mock('axios');
const e = env as unknown as Record<string, string | number>;

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
    expect(modlog?.send).toHaveBeenCalledWith(expect.stringContaining('Ally said "NAZI" in lounge'));
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

describe('isToxic', () => {
  const original = { token: e.MODERATE_HATESPEECH_TOKEN, normal: e.MODERATE_HATESPEECH_NORMAL_CONFIDENCE, flag: e.MODERATE_HATESPEECH_FLAG_CONFIDENCE };
  beforeEach(() => {
    e.MODERATE_HATESPEECH_TOKEN = 'token';
    e.MODERATE_HATESPEECH_NORMAL_CONFIDENCE = 0.8;
    e.MODERATE_HATESPEECH_FLAG_CONFIDENCE = 0.7;
  });
  afterEach(() => {
    e.MODERATE_HATESPEECH_TOKEN = original.token;
    e.MODERATE_HATESPEECH_NORMAL_CONFIDENCE = original.normal;
    e.MODERATE_HATESPEECH_FLAG_CONFIDENCE = original.flag;
  });

  it('does nothing without configuration', async () => {
    e.MODERATE_HATESPEECH_TOKEN = '';
    expect(await isToxic('x')).toEqual({ class: null, confidence: 0, isFlaggedOrLowConfidence: false });
    e.MODERATE_HATESPEECH_TOKEN = 'token';
    e.MODERATE_HATESPEECH_NORMAL_CONFIDENCE = 0;
    expect((await isToxic('x')).isFlaggedOrLowConfidence).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it.each([
    ['confident flag', { class: 'flag', confidence: 0.9 }, true],
    ['weak flag', { class: 'flag', confidence: 0.5 }, false],
    ['confident normal', { class: 'normal', confidence: 0.95 }, false],
    ['unsure normal', { class: 'normal', confidence: 0.5 }, true],
  ])('classifies a %s', async (_label, data, flagged) => {
    vi.mocked(axios.post).mockResolvedValue({ data });
    expect(await isToxic('text')).toEqual({ ...data, isFlaggedOrLowConfidence: flagged });
  });

  it('fails open when the API errors', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('timeout'));
    expect(await isToxic('text')).toEqual({ class: null, confidence: 0, isFlaggedOrLowConfidence: false });
  });
});

describe('monitorToxicity', () => {
  const original = {
    token: e.MODERATE_HATESPEECH_TOKEN, normal: e.MODERATE_HATESPEECH_NORMAL_CONFIDENCE, flag: e.MODERATE_HATESPEECH_FLAG_CONFIDENCE, env: e.NODE_ENV,
  };
  beforeEach(() => {
    e.MODERATE_HATESPEECH_TOKEN = 'token';
    e.MODERATE_HATESPEECH_NORMAL_CONFIDENCE = 0.8;
    e.MODERATE_HATESPEECH_FLAG_CONFIDENCE = 0.7;
    e.NODE_ENV = 'test';
  });
  afterEach(() => {
    e.MODERATE_HATESPEECH_TOKEN = original.token;
    e.MODERATE_HATESPEECH_NORMAL_CONFIDENCE = original.normal;
    e.MODERATE_HATESPEECH_FLAG_CONFIDENCE = original.flag;
    e.NODE_ENV = original.env;
  });

  function setup(opts: { reference?: boolean; fetchFails?: boolean } = {}) {
    const send = vi.fn();
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => ({ send })) } };
    const message = {
      content: 'bad words',
      author: '<@a>',
      url: 'https://m',
      reference: opts.reference ? { messageId: 'r1' } : null,
      channel: {
        messages: {
          fetch: opts.fetchFails
            ? vi.fn().mockRejectedValue(new Error('Unknown Message'))
            : vi.fn(async () => ({ content: 'earlier', author: '<@b>', url: 'https://r' })),
        },
      },
    };
    return { message: message as unknown as Message, send };
  }

  it('does nothing for clean messages', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { class: 'normal', confidence: 0.99 } });
    const { message, send } = setup();
    await monitorToxicity(message);
    expect(send).not.toHaveBeenCalled();
  });

  it('reports flagged messages to the dev log channel outside production', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { class: 'flag', confidence: 0.9 } });
    const { message, send } = setup();
    await monitorToxicity(message);
    const [{ embeds, allowedMentions }] = send.mock.calls[0];
    expect(embeds[0].description).toContain('**Message:** bad words');
    expect(embeds[0].description).not.toContain('Replying to');
    expect(allowedMentions).toEqual({ parse: [] });
    const channelFetch = (global as unknown as { discordClient: { channels: { fetch: ReturnType<typeof vi.fn> } } }).discordClient.channels.fetch;
    expect(channelFetch).toHaveBeenCalledWith(e.CHANNEL_BOTSPAM);
  });

  it('uses the AI mod channel in production and the error channel for uncertain results', async () => {
    e.NODE_ENV = 'production';
    vi.mocked(axios.post).mockResolvedValue({ data: { class: 'flag', confidence: 0.9 } });
    const prod = setup();
    await monitorToxicity(prod.message);
    const channelFetch = (global as unknown as { discordClient: { channels: { fetch: ReturnType<typeof vi.fn> } } }).discordClient.channels.fetch;
    expect(channelFetch).toHaveBeenCalledWith(e.CHANNEL_AIMOD_LOG);

    vi.mocked(axios.post).mockResolvedValue({ data: { class: 'normal', confidence: 0.1 } });
    const unsure = setup();
    await monitorToxicity(unsure.message);
    const unsureFetch = (global as unknown as { discordClient: { channels: { fetch: ReturnType<typeof vi.fn> } } }).discordClient.channels.fetch;
    expect(unsureFetch).toHaveBeenCalledWith(e.CHANNEL_BOTERRORS);
  });

  it('includes the replied-to message when available, and survives fetch errors', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { class: 'flag', confidence: 0.9 } });
    const withReply = setup({ reference: true });
    await monitorToxicity(withReply.message);
    expect(withReply.send.mock.calls[0][0].embeds[0].description).toContain('**Replying to**: earlier');
    const broken = setup({ reference: true, fetchFails: true });
    await monitorToxicity(broken.message);
    expect(broken.send.mock.calls[0][0].embeds[0].description).not.toContain('Replying to');
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
