import postAuditLog from '@discord/utils/auditLog';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  StickerDeleteEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const stickerDelete: StickerDeleteEvent = {
  name: 'stickerDelete',
  async execute(sticker) {
    if (!sticker.guild) return;
    await postAuditLog({
      guild: sticker.guild,
      type: AuditLogEvent.StickerDelete,
      subject: `Sticker ${sticker.name}`,
      action: 'deleted',
      caller: F,
    });
  },
};
export default stickerDelete;
