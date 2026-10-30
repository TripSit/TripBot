import postAuditLog from '@discord/utils/auditLog';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  EmojiUpdateEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const emojiUpdate: EmojiUpdateEvent = {
  name: 'emojiUpdate',
  async execute(oldEmoji, newEmoji) {
    await postAuditLog({
      guild: newEmoji.guild,
      type: AuditLogEvent.EmojiUpdate,
      subject: `Emoji **${newEmoji.toString()}**`,
      action: 'updated',
      showChanges: true,
      caller: F,
    });
  },
};

export default emojiUpdate;
