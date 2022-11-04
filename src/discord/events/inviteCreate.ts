import {
  Invite,
} from 'discord.js';
import {
  inviteEvent,
} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const inviteCreate: inviteEvent = {
  name: 'inviteCreate',

  async execute(invite: Invite) {
    // Only run on Tripsit
    if (invite.guild?.id !== env.DISCORD_GUILD_ID.toString()) {
      return;
    }
    log.info(`[${PREFIX}] Invite created: ${invite}`);
    global.guildInvites.get(invite.guild.id).set(invite.code, invite.uses);
  },
};
