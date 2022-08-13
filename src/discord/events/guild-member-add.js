'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { getUserInfo, setUserInfo } = require('../../global/services/firebaseAPI');

const {
  discordGuildId,
} = require('../../../env');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    // logger.debug(JSON.stringify(member, null, 2));
    // {
    //   "guildId": "960606557622657026",
    //   "joinedTimestamp": 1653515791290,
    //   "premiumSinceTimestamp": null,
    //   "nickname": null,
    //   "pending": false,
    //   "communicationDisabledUntilTimestamp": null,
    //   "userId": "332687787172167680",
    //   "avatar": null,
    //   "displayName": "cosmicowl",
    //   "roles": [
    //     "960606557622657026"
    //   ],
    //   "avatarURL": null,
    //   "displayAvatarURL": "https://cdn.discordapp.com/avatars/332687787172167680/6c38689c6390e2a2e9fe5e368db7b9e6.webp"
    // }

    // Only run on Tripsit
    if (member.guild.id === discordGuildId) {
      logger.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

      // (*INVITE*) https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
      /* Start *INVITE* code */
      const cachedInvites = global.guildInvites.get(member.guild.id);
      const newInvites = await member.guild.invites.fetch();
      let inviteInfo = '';
      try {
        const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code) < inv.uses);
        logger.debug(`Cached ${[...cachedInvites.keys()]}`);
        logger.debug(`New ${[...newInvites.values()].map(inv => inv.code)}`);
        // logger.debug(`Used ${JSON.stringify(usedInvite, null, 2)}`);
        logger.debug(`The code ${usedInvite.code} was just used by ${member.user.username}.`);
        logger.debug(`The code was created by ${usedInvite.inviterId}.`);
        if (usedInvite?.inviter) {
          const inviter = await client.users.fetch(usedInvite.inviter.id);
          if (inviter) {
            inviteInfo = `Joined via ${inviter.username}'s invite to ${usedInvite.channel.name} (${usedInvite.code}-${usedInvite.uses}).`;
          }
        }
      } catch (err) {
        logger.debug('OnGuildMember added via the standard link');
      }

      newInvites.each(inv => cachedInvites.set(inv.code, inv.uses));
      global.guildInvites.set(member.guild.id, cachedInvites);
      /* End *INVITE* code */

      // Extract member data
      const [actorData, actorFbid] = await getUserInfo(member);

      // Transform member data
      if ('discord' in actorData) {
        logger.debug(`[${PREFIX}] Actor data has a discord property`);
        actorData.discord.joinedTimestamp = member.joinedTimestamp;
        actorData.discord.inviteInfo = inviteInfo;
      } else {
        logger.debug(`[${PREFIX}] Actor data does not have a discord property`);
        actorData.discord = {
          joinedTimestamp: member.joinedTimestamp,
          inviteInfo,
        };
      }

      // Load member data
      await setUserInfo(actorFbid, actorData);
    }
  },
};
