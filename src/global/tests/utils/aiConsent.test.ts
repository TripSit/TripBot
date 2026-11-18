import {
  getAiChatUserIds, getAiConsentedIds, hasAiConsent, isAiChatAllowed,
} from '../../utils/aiConsent';
import { dbMock } from '../../../vitest/utils/mockDb';

describe('aiConsent', () => {
  it('returns only users who agreed to both the TOS and privacy policy', async () => {
    dbMock.users.findMany.mockResolvedValue([{ discord_id: 'a' }] as never);
    expect(await getAiConsentedIds(['a', 'b', 'a'])).toEqual(new Set(['a']));
    expect(dbMock.users.findMany).toHaveBeenCalledWith({
      where: {
        discord_id: { in: ['a', 'b'] },
        ai_info: { is: { ai_tos_agree: { not: null }, ai_privacy_agree: { not: null } } },
      },
      select: { discord_id: true },
    });
  });

  it('ignores rows without a discord id', async () => {
    dbMock.users.findMany.mockResolvedValue([{ discord_id: null }, { discord_id: 'a' }] as never);
    expect(await getAiConsentedIds(['a'])).toEqual(new Set(['a']));
  });

  it('skips the query when there is nobody to check', async () => {
    expect(await getAiConsentedIds([])).toEqual(new Set());
    expect(dbMock.users.findMany).not.toHaveBeenCalled();
  });

  it('checks a single user', async () => {
    dbMock.users.findMany.mockResolvedValueOnce([{ discord_id: 'a' }] as never);
    expect(await hasAiConsent('a')).toBe(true);
    dbMock.users.findMany.mockResolvedValueOnce([] as never);
    expect(await hasAiConsent('b')).toBe(false);
  });

  it('opens AI chat to the owner only, and still needs consent', async () => {
    const e = env as unknown as Record<string, string>;
    expect(isAiChatAllowed(e.DISCORD_OWNER_ID)).toBe(true);
    expect(isAiChatAllowed('someone-else')).toBe(false);
    dbMock.users.findMany.mockResolvedValueOnce([{ discord_id: e.DISCORD_OWNER_ID }] as never);
    expect(await getAiChatUserIds([e.DISCORD_OWNER_ID, 'someone-else'])).toEqual(new Set([e.DISCORD_OWNER_ID]));
    expect(dbMock.users.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({ discord_id: { in: [e.DISCORD_OWNER_ID] } }),
    }));
  });
});
