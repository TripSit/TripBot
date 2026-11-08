import { ChatInputCommandInteraction } from 'discord.js';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';
import { selfTimeout } from '../../commands/guild/d.selftimeout';

const INVALID_FORMAT_ERROR = 'Invalid duration format. '
  + 'Please provide a valid duration (e.g. 1 hour, 2 days, 1w). Max is 2 weeks!';
const OUT_OF_BOUNDS_ERROR = 'Timeout duration must be positive and cannot exceed 2 weeks!';

describe('selftimeout command', () => {
  let timeoutSpy: ReturnType<typeof vi.fn>;
  let editReplySpy: ReturnType<typeof vi.fn>;
  let modLogSendSpy: ReturnType<typeof vi.fn>;
  let interaction: ChatInputCommandInteraction;
  let targetMock: { timeout: ReturnType<typeof vi.fn>; user: { tag: string } };

  function buildInteraction(duration: string, confirmation = 'yes') {
    timeoutSpy = vi.fn().mockResolvedValue(undefined);
    editReplySpy = vi.fn().mockResolvedValue(undefined);
    modLogSendSpy = vi.fn().mockResolvedValue(undefined);

    targetMock = {
      timeout: timeoutSpy,
      user: { tag: 'TestUser#0001' },
    };

    interaction = {
      guild: { name: 'TripSit' },
      user: { tag: 'TestUser#0001', username: 'TestUser' },
      options: {
        getString: vi.fn((key: string) => {
          if (key === 'confirmation') return confirmation;
          if (key === 'duration') return duration;
          return null;
        }),
      },
      member: targetMock,
      client: {
        guilds: {
          fetch: vi.fn().mockResolvedValue({
            channels: {
              fetch: vi.fn().mockResolvedValue({
                send: modLogSendSpy,
              }),
            },
          }),
        },
      },
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: editReplySpy,
    } as unknown as ChatInputCommandInteraction;

    return interaction;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aborts when user declines confirmation', async () => {
    const mockInteraction = buildInteraction('1d', 'no');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(false);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(editReplySpy).toHaveBeenCalledWith({
      content: 'This works exactly like you think it does, try again when you\'re sure!',
    });
  });

  it('rejects malformed duration string without calling timeout', async () => {
    const mockInteraction = buildInteraction('invalid_duration');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(false);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(editReplySpy).toHaveBeenCalledWith({
      content: INVALID_FORMAT_ERROR,
    });
  });

  it('rejects partially malformed duration without calling timeout', async () => {
    const mockInteraction = buildInteraction('1d some_garbage_text');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(false);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(editReplySpy).toHaveBeenCalledWith({
      content: INVALID_FORMAT_ERROR,
    });
  });

  it('rejects zero duration (0s) without calling timeout', async () => {
    const mockInteraction = buildInteraction('0s');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(false);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(editReplySpy).toHaveBeenCalledWith({
      content: OUT_OF_BOUNDS_ERROR,
    });
  });

  it('rejects duration exceeding 2 weeks maximum (15d) without calling timeout', async () => {
    const mockInteraction = buildInteraction('15d');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(false);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(editReplySpy).toHaveBeenCalledWith({
      content: OUT_OF_BOUNDS_ERROR,
    });
  });

  it('rejects 3 weeks (3w) without calling timeout', async () => {
    const mockInteraction = buildInteraction('3w');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(false);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(editReplySpy).toHaveBeenCalledWith({
      content: OUT_OF_BOUNDS_ERROR,
    });
  });

  it('successfully times out member when valid duration within 2 weeks is provided', async () => {
    const mockInteraction = buildInteraction('2d');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(true);
    const expectedMs = 2 * 24 * 60 * 60 * 1000;
    expect(timeoutSpy).toHaveBeenCalledWith(expectedMs, 'Self timeout');
    expect(editReplySpy).toHaveBeenCalledWith({
      content: "We'll see you in 2d!",
    });
    expect(modLogSendSpy).toHaveBeenCalledWith('**TestUser#0001** self timed out for **2d**!');
  });

  it('accepts exact 2-week boundary duration (14d)', async () => {
    const mockInteraction = buildInteraction('14d');
    const result = await selfTimeout.execute(mockInteraction);

    expect(result).toBe(true);
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    expect(timeoutSpy).toHaveBeenCalledWith(twoWeeksMs, 'Self timeout');
    expect(editReplySpy).toHaveBeenCalledWith({
      content: "We'll see you in 14d!",
    });
  });
});
