'use strict';

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');
const logger = require('../utils/logger');
const template = require('../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../utils/firebase');

const {
  discordGuildId,
  channelGeneralId,
  channelStartId,
  channelTripsitId,
} = require('../../env');

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
    if (member.guild.id === discordGuildId) {
      logger.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

      // Extract member data
      const [actorData, actorFbid] = await getUserInfo(member);

      // Transform member data
      if ('discord' in actorData) {
        logger.debug(`[${PREFIX}] Actor data has a discord property`);
        if ('joinedTimestamp' in actorData.discord) {
          logger.debug(`[${PREFIX}] Updating joinedTimestamp info!`);
          actorData.discord.joinedTimestamp = member.joinedTimestamp;
        } else {
          logger.debug(`[${PREFIX}] Creating joinedTimestamp info!`);
          actorData.discord.joinedTimestamp = member.joinedTimestamp;
        }
      } else {
        logger.debug(`[${PREFIX}] Actor data does not have a discord property`);
        actorData.discord = {
          joinedTimestamp: member.joinedTimestamp,
        };
      }

      // Load member data
      await setUserInfo(actorFbid, actorData);

      // (*INVITE*) https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
      /* Start *INVITE* code */
      const cachedInvites = global.guildInvites.get(member.guild.id);
      const newInvites = await member.guild.invites.fetch();
      let footerText = '';
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
            footerText = `Joined via ${inviter.username}'s invite to ${usedInvite.channel.name} (${usedInvite.code}-${usedInvite.uses}).`;
          }
        }
      } catch (err) {
        logger.debug(`OnGuildMemberAdd issue: ${err}`);
      }

      newInvites.each(inv => cachedInvites.set(inv.code, inv.uses));
      global.guildInvites.set(member.guild.id, cachedInvites);
      /* Start *INVITE* code */

      // NOTE: Can be simplified with luxon
      const diff = Math.abs(Date.now() - member.user.createdAt);
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      // logger.debug(`[${PREFIX}] diff: ${diff}`);
      // logger.debug(`[${PREFIX}] years: ${years}`);
      // logger.debug(`[${PREFIX}] months: ${months}`);
      // logger.debug(`[${PREFIX}] weeks: ${weeks}`);
      // logger.debug(`[${PREFIX}] days: ${days}`);
      // logger.debug(`[${PREFIX}] hours: ${hours}`);
      // logger.debug(`[${PREFIX}] minutes: ${minutes}`);
      // logger.debug(`[${PREFIX}] seconds: ${seconds}`);
      let colorValue = 'RED';
      if (years > 0) {
        colorValue = 'WHITE';
      } else if (years === 0 && months > 0) {
        colorValue = 'PURPLE';
      } else if (months === 0 && weeks > 0) {
        colorValue = 'BLUE';
      } else if (weeks === 0 && days > 0) {
        colorValue = 'GREEN';
      } else if (days === 0 && hours > 0) {
        colorValue = 'YELLOW';
      } else if (hours === 0 && minutes > 0) {
        colorValue = 'ORANGE';
      } else if (minutes === 0 && seconds > 0) {
        colorValue = 'RED';
      }
      logger.debug(`[${PREFIX}] coloValue: ${colorValue}`);
      const channelGeneral = member.client.channels.cache.get(channelGeneralId);
      const channelStart = member.client.channels.cache.get(channelStartId);
      const channelTripsit = member.client.channels.cache.get(channelTripsitId);
      const embed = template.embedTemplate()
        .setAuthor({ name: '', iconURL: '', url: '' })
        .setColor(colorValue)
        .setThumbnail(member.user.displayAvatarURL())
        // .setTitle(`Welcome to TripSit ${member.user.username}!`)
        // .setTitle(`Welcome ${member.toString()} to TripSit ${member}!`)
        .setDescription(stripIndents`
                **Welcome to TripSit ${member}!**
                This is a positivity-enforced, drug-neutral, harm-reduction space.
                **If you need a tripsitter, click the button in ${channelTripsit}!**
                Check out ${channelStart} for more information, stay safe!`);

      embed.setFooter({
        text: footerText,
      });
      channelGeneral.send({ embeds: [embed] });
    }
  },
};
