import {
  RoleUpdateEvent,
} from '../../@types/eventDef';

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const roleUpdate: RoleUpdateEvent = {
  name: 'roleUpdate',
  async execute(/** oldRole, newRole* */) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    // if (newRole.guild.id !== env.DISCORD_GUILD_ID) {
    //   return;
    // }

    // This is super bad, need to rework
  },
};

export default roleUpdate;
