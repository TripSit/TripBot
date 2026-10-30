import postAuditLog from '@discord/utils/auditLog';
import {
  AuditLogEvent,
  ChannelType,
} from 'discord-api-types/v10';
import {
  ChannelDeleteEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const channelDelete: ChannelDeleteEvent = {
  name: 'channelDelete',
  async execute(channel) {
    // Dont run on DMs
    if (channel.type === ChannelType.DM) return;
    await postAuditLog({
      guild: channel.guild,
      type: AuditLogEvent.ChannelDelete,
      subject: `Channel ${channel.name}`,
      action: 'deleted',
      caller: F,
    });
  },
};

export default channelDelete;
