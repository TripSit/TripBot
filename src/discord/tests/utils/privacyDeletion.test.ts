import { Collection, DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
import { deleteDiscordPrivacyData } from '../../utils/privacyDeletion';

const DELETION_REASON = 'User requested deletion of their TripBot data';
const MISSING_PERMISSIONS = 'missing permissions';
const MODERATION_LOG = 'moderation-log';
const USER_ID = 'user-1';
const LOG_CHANNELS = new Set([env.CHANNEL_BOTERRORS, env.CHANNEL_BOTLOG, env.CHANNEL_MODLOG, env.CHANNEL_QUOTE_LOG]);
const REQUESTER_ID = '123456789012345678';

describe('deleteDiscordPrivacyData', () => {
  const removeRole = vi.fn();
  const fetchMember = vi.fn();
  const fetchGuild = vi.fn();
  const fetchChannel = vi.fn();
  const emptyLogChannel = () => ({
    isTextBased: () => true,
    messages: { fetch: vi.fn().mockResolvedValue(new Collection()) },
  });

  beforeEach(() => {
    removeRole.mockReset();
    fetchMember.mockReset();
    fetchGuild.mockReset();
    fetchChannel.mockReset();
    fetchChannel.mockImplementation(async (id: string) => (LOG_CHANNELS.has(id) ? emptyLogChannel() : null));
    fetchMember.mockResolvedValue({
      roles: { cache: { has: vi.fn(() => true) }, remove: removeRole },
    });
    fetchGuild.mockResolvedValue({ members: { fetch: fetchMember } });
    (global as unknown as { discordClient: unknown }).discordClient = {
      channels: { fetch: fetchChannel },
      guilds: { fetch: fetchGuild },
    };
  });

  it('deletes managed threads and removes the IRC Bridge role', async () => {
    const deleteThread = vi.fn();
    fetchChannel.mockImplementation(async (id: string) => (LOG_CHANNELS.has(id)
      ? emptyLogChannel()
      : { isThread: () => true, delete: deleteThread }));
    await deleteDiscordPrivacyData(USER_ID, ['ticket-thread', 'mod-thread'], []);
    expect(fetchChannel).toHaveBeenCalledTimes(6);
    expect(deleteThread).toHaveBeenCalledWith(DELETION_REASON);
    expect(removeRole).toHaveBeenCalledWith(env.ROLE_IRC_BRIDGE, DELETION_REASON);
  });

  it('fails closed when a cleanup target is not a thread', async () => {
    fetchChannel.mockImplementation(async (id: string) => (LOG_CHANNELS.has(id)
      ? emptyLogChannel()
      : { isThread: () => false }));
    await expect(deleteDiscordPrivacyData(USER_ID, ['not-a-thread'], [])).rejects.toThrow('is not a thread');
    expect(removeRole).not.toHaveBeenCalled();
  });

  it('still revokes bridge consent when there are no threads to delete', async () => {
    await deleteDiscordPrivacyData(USER_ID, [], []);
    expect(fetchChannel).toHaveBeenCalledWith(env.CHANNEL_BOTERRORS);
    expect(removeRole).toHaveBeenCalled();
  });

  it('removes the saved Best Of copy that links to a source message', async () => {
    const deleteMessage = vi.fn();
    const savedMessage = {
      id: 'saved-copy',
      embeds: [{ author: { url: 'https://discord.com/channels/guild/channel/source-message' } }],
      delete: deleteMessage,
    };
    const messages = new Collection([['saved-copy', savedMessage as never]]);
    fetchChannel.mockImplementation(async (id: string) => (LOG_CHANNELS.has(id)
      ? emptyLogChannel()
      : {
        isTextBased: () => true,
        messages: { fetch: vi.fn().mockResolvedValue(messages) },
      }));
    await deleteDiscordPrivacyData(USER_ID, [], ['source-message']);
    expect(deleteMessage).toHaveBeenCalledWith();
  });

  it('deletes bot log messages containing the requester Discord ID', async () => {
    const deleteLogMessage = vi.fn();
    const deleteUnrelatedLogMessage = vi.fn();
    const logMessages = new Collection([['log-1', {
      id: 'log-1', content: '', embeds: [{ description: REQUESTER_ID }], delete: deleteLogMessage,
    } as never], ['log-2', {
      id: 'log-2', content: 'unrelated log', delete: deleteUnrelatedLogMessage,
    } as never]]);
    fetchChannel.mockImplementation(async (id: string) => (LOG_CHANNELS.has(id)
      ? { isTextBased: () => true, messages: { fetch: vi.fn().mockResolvedValue(logMessages) } }
      : null));

    await deleteDiscordPrivacyData(REQUESTER_ID, [], []);
    expect(deleteLogMessage).toHaveBeenCalledWith();
    expect(deleteUnrelatedLogMessage).not.toHaveBeenCalled();
    // The quote log holds copies of saved quotes, so it is searched like the other log channels
    expect(fetchChannel).toHaveBeenCalledWith(env.CHANNEL_QUOTE_LOG);
  });

  const apiError = (code: number) => new DiscordAPIError({ message: 'synthetic Discord failure', code }, code, 404, 'GET', 'https://discord.invalid', {});

  it.each([RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.UnknownGuild])('ignores deleted log channels and guilds (%s)', async code => {
    fetchChannel.mockRejectedValue(apiError(code));
    await expect(deleteDiscordPrivacyData(USER_ID, [], [])).resolves.toBeUndefined();
    expect(removeRole).toHaveBeenCalled();
  });

  it.each([null, { isTextBased: () => false }])('handles missing or invalid logs (%s)', async channel => {
    fetchChannel.mockResolvedValue(channel);
    if (channel) await expect(deleteDiscordPrivacyData(USER_ID, [], [])).rejects.toThrow('not available');
    else await expect(deleteDiscordPrivacyData(USER_ID, [], [])).resolves.toBeUndefined();
  });

  it('keeps permission and network failures retryable', async () => {
    fetchChannel.mockRejectedValue(new Error(MISSING_PERMISSIONS));
    await expect(deleteDiscordPrivacyData(USER_ID, [], [])).rejects.toThrow(MISSING_PERMISSIONS);
    expect(removeRole).not.toHaveBeenCalled();
  });

  it.each([null, { isTextBased: () => false }])('fails if Best Of cannot be inspected (%s)', async channel => {
    fetchChannel.mockImplementation(async (id: string) => (LOG_CHANNELS.has(id) ? emptyLogChannel() : channel));
    await expect(deleteDiscordPrivacyData(USER_ID, [], ['source'])).rejects.toThrow('Best Of channel');
  });

  it('paginates logs and Best Of history and ignores unrelated archive copies', async () => {
    const unrelated = () => ({
      id: 'older', content: '', embeds: [], delete: vi.fn(),
    });
    const firstPage = new Collection(Array.from({ length: 100 }, (_unused, i) => [String(i), unrelated()]));
    const logFetch = vi.fn().mockResolvedValueOnce(firstPage).mockResolvedValueOnce(new Collection());
    const saved = { id: 'saved', embeds: [{ author: { url: 'https://discord.invalid/source' } }], delete: vi.fn() };
    const archiveFetch = vi.fn().mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(new Collection([['saved', saved]]));
    fetchChannel.mockImplementation(async (id: string) => {
      if (id === env.CHANNEL_BOTERRORS) return { isTextBased: () => true, messages: { fetch: logFetch } };
      if (LOG_CHANNELS.has(id)) return emptyLogChannel();
      return { isTextBased: () => true, messages: { fetch: archiveFetch } };
    });
    await deleteDiscordPrivacyData(USER_ID, [], ['source']);
    expect(logFetch).toHaveBeenLastCalledWith({ limit: 100, before: 'older' });
    expect(archiveFetch).toHaveBeenLastCalledWith({ limit: 100, before: 'older' });
    expect(saved.delete).toHaveBeenCalled();
  });

  it('completes when the saved archive message was already removed', async () => {
    fetchChannel.mockResolvedValue(emptyLogChannel());
    await expect(deleteDiscordPrivacyData(USER_ID, [], ['source'])).resolves.toBeUndefined();
  });

  it.each([null, RESTJSONErrorCodes.UnknownChannel])('retries safely with deleted threads (%s)', async code => {
    fetchChannel.mockImplementation(async (id: string) => {
      if (LOG_CHANNELS.has(id)) return emptyLogChannel();
      if (code) throw apiError(code);
      return null;
    });
    await expect(deleteDiscordPrivacyData(USER_ID, ['removed-thread'], [])).resolves.toBeUndefined();
  });

  it.each([RESTJSONErrorCodes.UnknownMember, RESTJSONErrorCodes.UnknownGuild])('completes when the user is no longer in the guild (%s)', async code => {
    fetchMember.mockRejectedValue(apiError(code));
    await expect(deleteDiscordPrivacyData(USER_ID, [], [])).resolves.toBeUndefined();
  });

  it('propagates role-removal failures and skips members without the bridge role', async () => {
    removeRole.mockRejectedValue(new Error(MISSING_PERMISSIONS));
    await expect(deleteDiscordPrivacyData(USER_ID, [], [])).rejects.toThrow(MISSING_PERMISSIONS);
    removeRole.mockClear();
    fetchMember.mockResolvedValue({ roles: { cache: { has: () => false }, remove: removeRole } });
    await deleteDiscordPrivacyData(USER_ID, [], []);
    expect(removeRole).not.toHaveBeenCalled();
  });

  it('also scans configured moderation log channels', async () => {
    const deleteMessage = vi.fn();
    const messages = new Collection([['mod-log-message', {
      id: 'mod-log-message', content: 'moderation action for 123456789012345678', delete: deleteMessage,
    } as never]]);
    fetchChannel.mockImplementation(async (id: string) => (id === MODERATION_LOG
      ? { isTextBased: () => true, messages: { fetch: vi.fn().mockResolvedValue(messages) } }
      : emptyLogChannel()));

    await deleteDiscordPrivacyData(REQUESTER_ID, [], [], [MODERATION_LOG]);
    expect(fetchChannel).toHaveBeenCalledWith(MODERATION_LOG);
    expect(deleteMessage).toHaveBeenCalledWith();
  });
});
