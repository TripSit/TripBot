import { AuditLogEvent, PermissionsBitField } from 'discord.js';
import {
  createActionDescription,
  formatChange,
  formatPermissionDiff,
  getActionEmoji,
  isAutoModAction,
} from '../../events/guildAuditLogAdd';

const perms = (...names: (keyof typeof PermissionsBitField.Flags)[]) => (
  new PermissionsBitField(names).bitfield.toString()
);
const HELPER = 'Helper';
const ADMIN = 'Administrator';
const TARGET = 'target#0002';
const MOD = 'mod#0001';
const NO_CHANGE = 'No effective change';

const userEntry = (action: AuditLogEvent, actionType: string) => ({
  action,
  actionType,
  targetType: 'User',
  executor: { tag: MOD },
  target: { tag: TARGET },
});

describe('formatPermissionDiff', () => {
  it('lists added and removed permissions', () => {
    const diff = formatPermissionDiff(perms('SendMessages', 'EmbedLinks'), perms('SendMessages', ADMIN));
    expect(diff).toContain('+ Administrator');
    expect(diff).toContain('- EmbedLinks');
    expect(diff).not.toContain('SendMessages');
  });

  it('distinguishes Administrator from a minor permission', () => {
    expect(formatPermissionDiff('0', perms(ADMIN))).toBe('+ Administrator');
    expect(formatPermissionDiff('0', perms('UseExternalEmojis'))).toBe('+ UseExternalEmojis');
  });

  it('reports no effective change and tolerates null or invalid values', () => {
    expect(formatPermissionDiff(perms('SendMessages'), perms('SendMessages'))).toBe(NO_CHANGE);
    expect(formatPermissionDiff(null, undefined)).toBe(NO_CHANGE);
    expect(formatPermissionDiff('not-a-number', 'nope')).toBe(NO_CHANGE);
  });
});

describe('formatChange', () => {
  it('labels role changes on a User target as roles added/removed', () => {
    const added = formatChange({ key: '$add', old: undefined, new: [{ id: '1', name: HELPER, color: 1 }] }, 'User');
    const removed = formatChange({ key: '$remove', old: undefined, new: [{ id: '1', name: HELPER, color: 1 }] }, 'User');
    expect(added).toBe('**Roles Added:** @Helper');
    expect(removed).toBe('**Roles Removed:** @Helper');
  });

  it('uses generic added/removed for non-user targets', () => {
    expect(formatChange({ key: '$add', old: undefined, new: [{ id: '1', name: 'x' }] }, 'Channel')).toBe('**Added:** #x');
  });

  it('shows the permission diff for permissions, allow and deny', () => {
    const next = perms(ADMIN);
    expect(formatChange({ key: 'permissions', old: '0', new: next }, 'Role')).toBe('**Permissions:**\n+ Administrator');
    expect(formatChange({ key: 'allow', old: '0', new: next }, 'Channel')).toBe('**Permissions Allowed:**\n+ Administrator');
    expect(formatChange({ key: 'deny', old: next, new: '0' }, 'Channel')).toBe('**Permissions Denied:**\n- Administrator');
  });
});

describe('getActionEmoji', () => {
  it('uses the user emoji for User updates', () => {
    expect(getActionEmoji('Update', 'User')).toBe('👤');
  });
});

describe('createActionDescription', () => {
  it('distinguishes a ban from a kick (both are Delete on a User)', () => {
    expect(createActionDescription(userEntry(AuditLogEvent.MemberBanAdd, 'Delete'))).toBe(`**${TARGET}** was banned`);
    expect(createActionDescription(userEntry(AuditLogEvent.MemberKick, 'Delete')))
      .toBe(`**${MOD}** kicked **${TARGET}**`);
  });

  it('reports unbans, updates, and voice actions', () => {
    expect(createActionDescription(userEntry(AuditLogEvent.MemberBanRemove, 'Create'))).toBe(`**${TARGET}** was unbanned`);
    expect(createActionDescription(userEntry(AuditLogEvent.MemberRoleUpdate, 'Update')))
      .toBe(`**${MOD}** updated member **${TARGET}**`);
    expect(createActionDescription(userEntry(AuditLogEvent.MemberDisconnect, 'Delete')))
      .toBe(`**${MOD}** disconnected **${TARGET}** from voice`);
  });

  it('describes AutoMod actions on a User target', () => {
    expect(createActionDescription(userEntry(AuditLogEvent.AutoModerationBlockMessage, 'Update')))
      .toBe(`AutoMod blocked a message from **${TARGET}**`);
  });
});

describe('isAutoModAction', () => {
  it('matches only the AutoMod action events', () => {
    expect(isAutoModAction(AuditLogEvent.AutoModerationBlockMessage)).toBe(true);
    expect(isAutoModAction(AuditLogEvent.AutoModerationUserCommunicationDisabled)).toBe(true);
    expect(isAutoModAction(AuditLogEvent.MemberKick)).toBe(false);
  });
});
