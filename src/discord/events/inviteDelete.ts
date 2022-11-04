import {
  Invite,
} from 'discord.js';
import {
  inviteEvent,
} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const inviteDelete: inviteEvent = {
  name: 'inviteDelete',

  async execute(invite: Invite) {
    // Only run on Tripsit
    if (invite.guild?.id !== env.DISCORD_GUILD_ID.toString()) {
      return;
    }
    log.info(`[${PREFIX}] Invite deleted: ${invite}`);
    // Delete the Invite from Cache
    global.guildInvites.get(invite.guild.id).delete(invite.code);
  },
};
