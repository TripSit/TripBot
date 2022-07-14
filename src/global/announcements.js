'use strict';

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags/lib');
const template = require('./embed-template');
const logger = require('./logger');

const {
  NODE_ENV,
  channelGeneralId,
  channelHowToTripsitId,
  channelTripsitId,
  channelViploungeId,
  channelPetsId,
  channelFoodId,
  channelMusicId,
  channelScienceId,
  channelGamingId,
  channelCreativeId,
  // channelPsychedelicId,
  channelVipWelcomeId,
  channelGoldLoungeId,
  channelTalkToTSId,
  // channelClearmindId,
  channelPsychonautId,
  channelDissonautId,
} = require('../../env');

let frequency = 50;
if (NODE_ENV === 'development') {
  frequency = 2;
}
const messageCounter = {};

const voteBanEmoji = NODE_ENV === 'production'
  ? '<:vote_ban:988998870837100565>'
  : '<:vote_ban:989268075851427910>';
const voteKickEmoji = NODE_ENV === 'production'
  ? '<:vote_kick:989531430164004934>'
  : '<:vote_kick:989268074945466388>';
const voteTimeoutEmoji = NODE_ENV === 'production'
  ? '<:vote_timeout:988998872875556904>'
  : '<:vote_timeout:989268073792012299>';
const voteUnderbanEmoji = NODE_ENV === 'production'
  ? '<:vote_underban:989000993201082379>'
  : '<:vote_underban:989268073192255529>';

module.exports = {
  async announcements(message) {
    logger.debug(`[${PREFIX}] starting!`);

    // logger.debug(`[${PREFIX}] (${messageCounter[message.channel.id] || 0})
    // Message sent by ${message.author.username} in ${message.channel.name} on ${message.guild}`);

    let channelGeneral;
    let channelPets;
    let channelFood;
    let channelMusic;
    let channelScience;
    let channelGaming;
    let channelCreative;
    let channelHowToTripsit;
    let channelTripsit;
    let channelVipWelcome;
    let channelViplounge;
    let channelGoldLounge;
    let channelTalkToTS;
    // let channelPsychedelic
    // let channelClearmind;
    let channelPsychonaut;
    let channelDissonaut;

    try {
      channelGeneral = message.guild.channels.cache.get(channelGeneralId);
      channelPets = message.client.channels.cache.get(channelPetsId);
      channelFood = message.client.channels.cache.get(channelFoodId);
      channelMusic = message.client.channels.cache.get(channelMusicId);
      channelScience = message.client.channels.cache.get(channelScienceId);
      channelGaming = message.client.channels.cache.get(channelGamingId);
      channelCreative = message.client.channels.cache.get(channelCreativeId);
      // channelPsychedelic = message.client.channels.cache.get(channelPsychedelicId);
      channelHowToTripsit = message.client.channels.cache.get(channelHowToTripsitId);
      channelTripsit = message.client.channels.cache.get(channelTripsitId);
      channelVipWelcome = message.client.channels.cache.get(channelVipWelcomeId);
      channelViplounge = message.client.channels.cache.get(channelViploungeId);
      channelGoldLounge = message.client.channels.cache.get(channelGoldLoungeId);
      channelTalkToTS = message.client.channels.cache.get(channelTalkToTSId);
      // channelClearmind = message.client.channels.cache.get(channelClearmindId);
      channelPsychonaut = message.client.channels.cache.get(channelPsychonautId);
      channelDissonaut = message.client.channels.cache.get(channelDissonautId);
    } catch (error) {
      const errorObj = error;
      errorObj.stackTraceLimit = Infinity;
      logger.error(`[${PREFIX}] error.name: ${errorObj.name} on line ${errorObj.stack.split('\n')[4]}`);
      logger.error(`[${PREFIX}] error.message: ${errorObj.message}`);
      logger.error(`[${PREFIX}] error.stack: ${errorObj.stack}`);
      logger.error(`[${PREFIX}] error.code: ${errorObj.code}`);
    }

    const happyEmojis = [
      '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
      '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
      '😎', '😺', '😸', '😹', '😻', '🐵', '👍', '✌',
    ];

    const heartEmojis = [
      '❤', '🧡', '💛', '💚', '💙', '💜',
      '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣',
    ];

    const kipp = stripIndents`
    ${happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 9).join(' ')}
    ${heartEmojis[Math.floor(Math.random() * heartEmojis.length)]}\
    Keep It Positive Please!\
    ${heartEmojis[Math.floor(Math.random() * heartEmojis.length)]}
    ${happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 9).join(' ')}`;

    const movingEmojis = [
      '🏃', '🏃‍♂️', '🏃‍♀️', '🏃🏽', '🏃🏾', '🏃🏿',
      '🚴', '🚴🏻', '🚴🏼', '🚴🏽', '🚴🏾', '🚴🏿',
      '🚵', '🚵🏻', '🚵🏼', '🚵🏽', '🚵🏾', '🚵🏿',
      '⛹', '⛹🏻', '⛹🏼', '⛹🏽', '⛹🏾', '⛹🏿',
      '🤸', '🤸🏻', '🤸🏼', '🤸🏽', '🤸🏾', '🤸🏿',
      '🤼', '🤼🏻', '🤼🏼', '🤼🏽', '🤼🏾', '🤼🏿',
      '🤾', '🤾🏻', '🤾🏼', '🤾🏽', '🤾🏾', '🤾🏿',
      '🤹', '🤹🏻', '🤹🏼', '🤹🏽', '🤹🏾', '🤹🏿',
      '🧘', '🧘🏻', '🧘🏼', '🧘🏽', '🧘🏾', '🧘🏿',
      '🏌', '🏌️‍♂️', '🏌️‍♀️', '🏌🏽', '🏌🏾', '🏌🏿',
      '🤾', '🤾🏻', '🤾🏼', '🤾🏽', '🤾🏾', '🤾🏿',
      '🚶‍♂️', '🚶‍♀️', '🚶🏽', '🚶🏾', '🚶🏿',
      '🏇', '⛷', '🏂', '🤺',
      '🏋', '🏋‍♂️', '🏋‍♀️',
      '🧎', '🧎‍♂️', '🧎‍♀️',
      '💃', '🕺', '🕴',
    ];

    const move = stripIndents`
      ${movingEmojis.sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}
      **It's good to get up and move every hour!**
      ${movingEmojis.sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}`;

    const waterAndTeaEmojis = [
      '🏊', '🏊🏻', '🏊🏼', '🏊🏽', '🏊🏾', '🏊🏿',
      '🏄', '🏄🏻', '🏄🏼', '🏄🏽', '🏄🏾', '🏄🏿',
      '🚣', '🚣🏻', '🚣🏼', '🚣🏽', '🚣🏾', '🚣🏿',
      '🤽', '🤽🏻', '🤽🏼', '🤽🏽', '🤽🏾', '🤽🏿',
      '🛀', '🛀🏻', '🛀🏼', '🛀🏽', '🛀🏾', '🛀🏿',
      '💧', '🌊', '💦', '🐃', '🧊', '⛲',
      // '🧖‍♂️', '🧖🏻‍♂️', '🧖🏼‍♂️', '🧖🏽‍♂️', '🧖🏾‍♂️', '🧖🏿‍♂️',
      // '🧖‍♀️', '🧖🏻‍♀️', '🧖🏼‍♀️', '🧖🏽‍♀️', '🧖🏾‍♀️', '🧖🏿‍♀️',
      '🍼', '🥛', '☕', '🍵', '🥤', '🧃', '🧉',
      '🚤', '🛳', '⛴', '🚢',
    ];

    const hydrate = stripIndents`
      ${waterAndTeaEmojis.sort(() => 0.5 - Math.random()).slice(0, 14).join(' ')}
      ⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️
      ${waterAndTeaEmojis.sort(() => 0.5 - Math.random()).slice(0, 14).join(' ')}`;

    const moderate = stripIndents`
      Help the community by using the community moderation tools!
      If one of these reactions are applied to a message 3 times, various things will happen:

      ${voteTimeoutEmoji} - One-hour timeout. Mods will review context and take further action as appropriate.
      ${voteKickEmoji} - One-day timeout & KICK request. Kicked after a day if mods don't say otherwise.
      ${voteBanEmoji} - One-day timeout & BAN request. Kicked after a day if mods don't say otherwise.
      ${voteUnderbanEmoji} - Request age verification. Quarantines the user from 18+ content pending review.
      `;

    const generalAnnouncements = [
      hydrate,
      moderate,
      move,
      kipp,
      'Reminder: For the safety of everyone involved, sourcing (buying or selling anything) is against our network rules. If you are contacted by someone asking to find, buy, trade, or give you drugs, you can report it by using /report. This rule also applies to private messages. Be safe and don\'t trust random internet folk.',
      'We do our best to keep the environment here as safe as possible but please remember to always be vigilant when using the internet. Do not post anything here that might divulge any of your personal information.',
      'Donate to keep TripSit running and fund our future Harm Reduction projects!\nDonate page: https://tripsit.me/donate/\nBTC: 1EDqf32gw73tc1WtgdT2FymfmDN4RyC9RN\nPayPal: teknos@tripsit.me\nPatreon: https://patreon.com/tripsit\nMerchandise: https://tripsit.myspreadshop.com/',
      'Try to dose with a friend. Share with your friend any substances you have taken and how much. Communicate if you are not feeling well or if you need a break.',
      'Sleep is important! A sleep deficit can impair you more than drinking alcohol.',
      'Do not drive after dosing, even if you don\'t feel the effects',
      'Redosing is not usually a good idea: Sometimes both doses will kick in, sometimes your tolerance will waste both doses',
      'LSD and Mushrooms share a tolerance! Check out /calc-psychedelics for more info',
      'When snorting, crush your powder as fine as possible and make sure everyone has their own straw. Alternate nostrils between hits.',
      `Share pictures of your doggos, kittos and other creaturos in ${channelPets.toString()}!`,
      `Compare recipes and drool over someone's latest creation in ${channelFood.toString()}!`,
      `Share your favorite songs in ${channelMusic.toString()}!`,
      `Do you enjoy playing games? Join ${channelGaming.toString()} for gaming talk and join the TripSit Steam group!`,
      `Science enthusiasts of all types are welcome in ${channelScience.toString()}!`,
      `Show off your latest hobby, painting, or even song of your own making in ${channelCreative.toString()}!`,
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
      `You must be VIP to enter the ${channelViplounge.toString()}, it's meant to be more calm and a step away from ${channelGeneral.toString()}chat.`,
      `Team Tripsit is always happy to hear your feedback, join #talk-to-tripsit ${channelTalkToTS.toString()}and say hi!`,
      `Donate via the patreon or give our discord a boost to access the #gold-lounge ${channelGoldLounge.toString()}room, where everything is better because you paid for it!`,
      `Philosophy and spirituality talk is encouraged in the #psychonaut ${channelPsychonaut.toString()}room!`,
      `Disociative speculation and theory is encouraged in the #dissonaut ${channelDissonaut.toString()}room!`,
      `Want to help out tripsit 'behind the scenes'? Review the #vip-welcome ${channelVipWelcome.toString()} room and pick up the Coder role to access the Development category where we discuss projects and ideas! You don't need to be a coder to be Headers, all input is welcome`,
    ];

    const embed = template.embedTemplate();

    // Check if this the messageCounter is a multiple of ${frequency}
    if (messageCounter[message.channel.id] % frequency === 0) {
      let randomAnnouncement = '';
      let hydration = false;
      if (channelGeneralId === message.channel.id) {
        // General channel
        const randomNumber = Math.floor(Math.random() * generalAnnouncements.length);
        randomAnnouncement = generalAnnouncements[randomNumber];
        if (randomNumber === 0) {
          hydration = true;
        }
      } else if (channelViploungeId === message.channel.id) {
        // VIP channel
        randomAnnouncement = vipAnnouncements[
          Math.floor(Math.random() * vipAnnouncements.length)];
      }

      embed.setDescription(randomAnnouncement);

      if (hydration) {
        embed.setAuthor(null);
        embed.setFooter({ text: 'React to get your sparkle points for the /h2flow club!' });
        await message.channel.send({ embeds: [embed], ephemeral: false })
          .then(async msg => {
            await msg.react('💧');
          });
        return;
      }

      if (randomAnnouncement) {
        message.channel.send({ embeds: [embed], ephemeral: false });
      }
    }
    messageCounter[message.channel.id] = messageCounter[message.channel.id]
      ? messageCounter[message.channel.id] + 1
      : 1;
    // logger.debug(`[${PREFIX}] messageCounter: ${messageCounter}`);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
