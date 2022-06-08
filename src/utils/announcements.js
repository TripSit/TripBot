'use strict';

const path = require('path');
const template = require('./embed-template');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const {
  channelGeneralId,
  channelHowToTripsitId,
  channelTripsitId,
  channelLoungeId,
  channelPetsId,
  channelFoodId,
  channelMusicId,
  channelScienceId,
  channelGamingId,
  channelCreativeId,
  channelPsychedelicId,
  channelVipWelcomeId,
  channelGoldLoungeId,
  channelTalkToTSId,
  // channelClearmindId,
  channelPsychonautId,
  channelDissonautId,
} = require('../../env');

const frequency = 2;
const messageCounter = {};

module.exports = {
  async announcements(message) {
    logger.debug(`[${PREFIX}] (${messageCounter[message.channel.id] || 0}) Message sent by ${message.author.username} in ${message.channel.name} on ${message.guild}`);
    const channelGeneral = message.guild.channels.cache.get(channelGeneralId);
    const channelPets = message.client.channels.cache.get(channelPetsId);
    const channelFood = message.client.channels.cache.get(channelFoodId);
    const channelMusic = message.client.channels.cache.get(channelMusicId);
    const channelScience = message.client.channels.cache.get(channelScienceId);
    const channelGaming = message.client.channels.cache.get(channelGamingId);
    const channelCreative = message.client.channels.cache.get(channelCreativeId);
    const channelPsychedelic = message.client.channels.cache.get(channelPsychedelicId);

    const channelHowToTripsit = message.client.channels.cache.get(channelHowToTripsitId);
    const channelTripsit = message.client.channels.cache.get(channelTripsitId);

    const channelVipWelcome = message.client.channels.cache.get(channelVipWelcomeId);
    const channelLounge = message.client.channels.cache.get(channelLoungeId);
    const channelGoldLounge = message.client.channels.cache.get(channelGoldLoungeId);
    const channelTalkToTS = message.client.channels.cache.get(channelTalkToTSId);
    // const channelClearmind = message.client.channels.cache.get(channelClearmindId);
    const channelPsychonaut = message.client.channels.cache.get(channelPsychonautId);
    const channelDissonaut = message.client.channels.cache.get(channelDissonautId);

    const generalAnnouncements = [
      'Reminder: For the safety of everyone involved, sourcing (buying or selling anything) is against our network rules. If you are contacted by someone asking to find, buy, trade, or give you drugs, you can report it by using /report. This rule also applies to private messages. Be safe and don\'t trust random internet folk.',
      'We do our best to keep the environment here as safe as possible but please remember to always be vigilant when using the internet. Do not post anything here that might divulge any of your personal information.',
      'Donate to keep TripSit running and fund our future Harm Reduction projects!\nDonate page: https://tripsit.me/donate/\nBTC: 1EDqf32gw73tc1WtgdT2FymfmDN4RyC9RN\nPayPal: teknos@tripsit.me\nPatreon: https://patreon.com/tripsit\nMerchandise: https://tripsit.myspreadshop.com/',
      'Try to dose with a friend. Share with your friend any substances you have taken and how much. Communicate if you are not feeling well or if you need a break.',
      'Sleep is important! A sleep deficit can impair you more than drinking alcohol.',
      'Do not drive after dosing, even if you don\'t feel the effects',
      'Redosing is not usually a good idea: Sometimes both doses will kick in, sometimes your tollerance will waste both doses',
      'LSD and Mushrooms share a tollerance! Check out /calc-psychedelics for more info',
      'When snorting, crush your powder as fine as possible and make sure everyone has their own straw. Alternate nostrils between hits.',
      `Share pictures of your doggos, kittos and other creaturos in ${channelPets.toString()}!`,
      `Compare recipes and drool over someone's latest creation in ${channelFood.toString()}!`,
      `Share your favorite songs in ${channelMusic.toString()}!`,
      `Do you enjoy playing games? Join ${channelGaming.toString()} for gaming talk and join the TripSit Steam group!`,
      `Science enthusiasts of all types are welcome in ${channelScience.toString()}!`,
      `Show off your latest hobby, painting, or even song of your own making in ${channelCreative.toString()}!`,
      `Discuss psychedelics and other fun stuff while tripping in ${channelPsychedelic.toString()}!`,
      'Track your dosages with the /idose command!',
      'Set your birthday with the /birthday command!',
      'Set your timeszone with the /time command!',
      'Check your karma with the /karma command!',
    ];

    const vipAnnouncements = [
      'Did you know that platypus venom can cause extreme sensitivity to pain, which can last for months and isn\'t even alleviated by morphine? TripSit recommends staying away from platypi, especially under the influence of drugs.',
      'If Tripbot starts speaking to you in a language other than English, you may need medical attention, please seek help!',
      `Help out your fellow humans by reading ${channelHowToTripsit.toString()} and pick up the helper role to help in ${channelTripsit.toString()}!`,
      `Check out ${channelVipWelcome.toString()} for some more information about TripSit VIPs!`,
      `You must be level 5 to enter the ${channelLounge.toString()}, it's meant to be more calm and a step away from ${channelGeneral.toString()}chat.`,
      `Team Tripsit is always happy to hear your feedback, join #talk-to-tripsit ${channelTalkToTS.toString()}and say hi!`,
      `Donate via the patreon or give our discord a boost to access the #gold-lounge ${channelGoldLounge.toString()}room, where everything is better because you paid for it!`,
      `Philosophy and spirituality talk is encouraged in the #psychonaut ${channelPsychonaut.toString()}room!`,
      `Disociative speculation and theory is encouraged in the #dissonaut ${channelDissonaut.toString()}room!`,
      `Want to help out tripsit 'behind the scenes'? Review the #vip-welcome ${channelVipWelcome.toString()} room and pick up the Coder role to access the Development category where we discuss projects and ideas! You don't need to be a coder to be Headers, all input is welcome`,
    ];

    // const sanctuaryAnnouncements = [
    //   '#sanctuary is a slower, positive, chat channel for people currently tripping.
    //  If there are too many people talking, or for general chat please consider moving
    //   to #lounge or #drugs, or check out the ~channels list for more options.',
    // ];

    const embed = template.embedTemplate();

    // Check if this the messageCounter is a multiple of ${frequency}
    if (messageCounter[message.channel.id] % frequency === 0) {
      if (channelGeneralId === message.channel.id) {
        // General channel
        const randomAnnouncement = generalAnnouncements[
          Math.floor(Math.random() * generalAnnouncements.length)];
        embed.setDescription(randomAnnouncement);
        message.channel.send({ embeds: [embed], ephemeral: false });
      } else if (channelLoungeId === message.channel.id) {
        // VIP channel
        const randomAnnouncement = vipAnnouncements[
          Math.floor(Math.random() * vipAnnouncements.length)];
        embed.setDescription(randomAnnouncement);
        message.channel.send({ embeds: [embed], ephemeral: false });
      }
      // else if (channelSanctuaryId === channel.id) {
      //   // Sanctuary channel
      //   const randomAnnouncement = sanctuaryAnnouncements[
      //     Math.floor(Math.random() * sanctuaryAnnouncements.length)];
      //   channel.send(randomAnnouncement);
      // }
    }
    messageCounter[message.channel.id] = messageCounter[message.channel.id]
      ? messageCounter[message.channel.id] + 1
      : 1;
    // logger.debug(`[${PREFIX}] messageCounter: ${messageCounter}`);
  },
};
