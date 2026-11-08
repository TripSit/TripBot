import { AuditLogEvent, PermissionFlagsBits } from 'discord.js';
import {
  EMBED_DESCRIPTION_LIMIT,
  createActionDescription,
  formatChange,
  formatValue,
  truncate,
} from '../../utils/auditLogFormat';

describe('auditLogFormat', () => {
  describe('truncate', () => {
    it('leaves short text alone and cuts long text to the limit', () => {
      expect(truncate('abc', 10)).toBe('abc');
      const cut = truncate('a'.repeat(5000), EMBED_DESCRIPTION_LIMIT);
      expect(cut).toHaveLength(EMBED_DESCRIPTION_LIMIT);
      expect(cut.endsWith('…')).toBe(true);
    });
  });

  describe('formatValue', () => {
    it('describes empty values by key', () => {
      expect(formatValue(null, 'nick')).toBe('No nickname');
      expect(formatValue(undefined, 'communication_disabled_until')).toBe('Not timed out');
      expect(formatValue(null)).toBe('None');
    });

    it('renders timeouts as a Discord timestamp, not a server-locale string', () => {
      expect(formatValue('2026-01-01T00:00:00.000Z', 'communication_disabled_until')).toBe('Until <t:1767225600:f>');
    });

    it('decodes permission bitfields for allow/deny/permissions', () => {
      const bits = (PermissionFlagsBits.SendMessages + PermissionFlagsBits.ViewChannel).toString();
      expect(formatValue(bits, 'allow')).toContain('SendMessages');
      expect(formatValue('0', 'deny')).toBe('No permissions');
    });

    it('escapes markdown in strings and handles bigint inside objects', () => {
      expect(formatValue('**bold**', 'name')).toBe('\\*\\*bold\\*\\*');
      expect(() => formatValue({ a: 1n })).not.toThrow();
    });
  });

  describe('formatChange', () => {
    it('summarises a permissions change as added and removed permissions', () => {
      const out = formatChange({
        key: 'permissions',
        old: PermissionFlagsBits.SendMessages.toString(),
        new: PermissionFlagsBits.ViewChannel.toString(),
      }, 'Role');
      expect(out).toContain('➕ ViewChannel');
      expect(out).toContain('➖ SendMessages');
    });

    it('converts bitrate from bits to kbps', () => {
      expect(formatChange({ key: 'bitrate', old: 64000, new: 96000 }, 'Channel')).toBe('**Bitrate:** 64kbps → 96kbps');
    });

    it('labels role changes on members', () => {
      expect(formatChange({ key: '$add', new: [{ id: '1', name: 'Helper', color: 0 }] }, 'User'))
        .toBe('**Roles Added:** @Helper');
    });
  });

  describe('createActionDescription', () => {
    const base = { executor: { tag: 'mod#0001' }, target: { tag: 'user#0002' }, targetType: 'User' };

    it.each([
      [AuditLogEvent.MemberBanAdd, 'Create', '**user#0002** was banned'],
      [AuditLogEvent.MemberBanRemove, 'Delete', '**user#0002** was unbanned'],
      [AuditLogEvent.MemberKick, 'Delete', '**user#0002** was kicked'],
    ])('keys member descriptions off the audit event (%s)', (action, actionType, expected) => {
      expect(createActionDescription({ ...base, action, actionType })).toBe(expected);
    });

    it('does not call a prune or bot add a ban', () => {
      const prune = createActionDescription({ ...base, action: AuditLogEvent.MemberPrune, actionType: 'Delete' });
      expect(prune).not.toContain('banned');
      const botAdd = createActionDescription({ ...base, action: AuditLogEvent.BotAdd, actionType: 'Create' });
      expect(botAdd).not.toContain('unbanned');
    });

    it('handles a null target and escapes names', () => {
      const out = createActionDescription({
        executor: { tag: '_evil_' }, target: null, targetType: 'Role', actionType: 'Update',
      });
      expect(out).toBe('**\\_evil\\_** updated role **Unknown Target**');
    });
  });
});
