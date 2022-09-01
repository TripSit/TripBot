/* eslint-disable max-len */
import {
  Message,
} from 'discord.js';
import env from '../../global/utils/env.config';
import {embedTemplate} from './embedTemplate';
import {stripIndents} from 'common-tags';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

let frequency = 50;
if (env.NODE_ENV === 'development') {
  frequency = 2;
}
const messageCounter = {} as messageCounterType;


type messageCounterType = {
  [key: string]: number;
}

/**
 *
 * @param {Message} message
 */
export async function announcements(message:Message) {
  // logger.debug(`[${PREFIX}] starting!`);

  // logger.debug(`[${PREFIX}] (${messageCounter[message.channel.id] || 0})
  // Message sent by ${message.author.username} in ${message.channel.name} on ${message.guild}`);

  const channelGeneral = message.guild!.channels.cache.get(env.CHANNEL_GENERAL)!;
  const channelPets = message.client.channels.cache.get(env.CHANNEL_PETS)!;
  const channelFood = message.client.channels.cache.get(env.CHANNEL_FOOD)!;
  const channelMusic = message.client.channels.cache.get(env.CHANNEL_MUSIC)!;
  const channelScience = message.client.channels.cache.get(env.CHANNEL_SCIENCE)!;
  const channelGaming = message.client.channels.cache.get(env.CHANNEL_GAMING)!;
  const channelCreative = message.client.channels.cache.get(env.CHANNEL_CREATIVE)!;
  // const channelPsychedelic = message.client.channels.cache.get(channelPsychedelicId)!;
  const channelHowToTripsit = message.client.channels.cache.get(env.CHANNEL_HOWTOTRIPSIT)!;
  const channelTripsit = message.client.channels.cache.get(env.CHANNEL_TRIPSIT)!;
  const channelVipWelcome = message.client.channels.cache.get(env.CHANNEL_VIPWELCOME)!;
  const channelViplounge = message.client.channels.cache.get(env.CHANNEL_VIPLOUNGE)!;
  const channelGoldLounge = message.client.channels.cache.get(env.CHANNEL_GOLDLOUNGE)!;
  const channelTalkToTS = message.client.channels.cache.get(env.CHANNEL_TALKTOTS)!;
  // const channelClearmind = message.client.channels.cache.get(CHANNEL_CLEARMIND)!;
  const channelPsychonaut = message.client.channels.cache.get(env.CHANNEL_PSYCHONAUT)!;
  const channelDissonaut = message.client.channels.cache.get(env.CHANNEL_DISSONAUT)!;


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

  // const moderate = stripIndents`
  //   Help the community by using the community moderation tools!
  //   If one of these reactions are applied to a message 3 times, various things will happen:

  //   ${voteTimeoutEmoji} -
  // One-hour timeout. Mods will review context and take further action as appropriate.
  //   ${voteKickEmoji} -
  // One-day timeout & KICK request. Kicked after a day if mods don't say otherwise.
  //   ${voteBanEmoji} -
  // One-day timeout & BAN request. Kicked after a day if mods don't say otherwise.
  //   ${voteUnderbanEmoji} -
  // Request age verification. Quarantines the user from 18+ content pending review.
  //   `;

  const generalAnnouncements = [
    hydrate,
    // moderate,
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
    // 'Check your karma with the /karma command!',
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

  const embed = embedTemplate();

  // Check if this the messageCounter is a multiple of ${frequency}
  logger.debug(`${PREFIX} - messageCounter: ${JSON.stringify(messageCounter, null, 2)}`);
  logger.debug(`${PREFIX} - message.channel.id: ${JSON.stringify(message.channel.id, null, 2)}`);
  logger.debug(`${PREFIX} - message.channel.id: ${JSON.stringify(messageCounter[message.channel.id], null, 2)}`);
  logger.debug(`${PREFIX} - frequency: ${frequency}`);

  if (messageCounter[message.channel.id] % frequency === 0) {
    let randomAnnouncement = null;
    let hydration = false;
    if (env.CHANNEL_GENERAL === message.channel.id) {
      // General channel
      const randomNumber = Math.floor(Math.random() * generalAnnouncements.length);
      randomAnnouncement = generalAnnouncements[randomNumber];
      if (randomNumber === 0) {
        hydration = true;
      }
    } else if (env.CHANNEL_VIPLOUNGE === message.channel.id) {
      // VIP channel
      randomAnnouncement = vipAnnouncements[
          Math.floor(Math.random() * vipAnnouncements.length)];
    }

    logger.debug(`[${PREFIX}] randomAnnouncement: ${randomAnnouncement}`);
    embed.setDescription(randomAnnouncement);

    if (hydration) {
      embed.setAuthor(null);
      embed.setFooter({text: 'React to get your sparkle points for the /h2flow club!'});
      await message.channel.send({embeds: [embed]})
          .then(async (msg) => {
            await msg.react('💧');
          });
      return;
    }

    if (randomAnnouncement) {
      message.channel.send({embeds: [embed]});
    }
  }
  messageCounter[message.channel.id] = messageCounter[message.channel.id] ?
      messageCounter[message.channel.id] + 1 :
      1;

  logger.debug(`${PREFIX} - messageCounter: ${JSON.stringify(messageCounter, null, 2)}`);
  // logger.debug(`[${PREFIX}] messageCounter: ${messageCounter}`);
  // logger.debug(`[${PREFIX}] finished!`);
};
