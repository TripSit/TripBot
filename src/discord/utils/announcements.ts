/* eslint-disable max-len */
import {
  Message,
  TextChannel,
} from 'discord.js';
import env from '../../global/utils/env.config';
import {embedTemplate} from './embedTemplate';
import {stripIndents} from 'common-tags';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

let frequency = 50;
if (env.NODE_ENV === 'development') {
  frequency = 2;
}
const messageCounter = {} as messageCounterType;

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

const happyEmojis = [
  '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
  '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
  '😎', '😺', '😸', '😹', '😻', '🐵', '👍', '✌',
];

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜',
  '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣',
];

type messageCounterType = {
  [key: string]: number;
}

/**
 *
 * @param {Message} message
 */
export async function announcements(message:Message) {
  logger.debug(`[${PREFIX}] starting!`);

  const channelStart = message.client.channels.cache.get(env.CHANNEL_START)!.toString();
  const channelAnnouncements = message.client.channels.cache.get(env.CHANNEL_ANNOUNCEMENTS)!.toString();
  const channelRules = message.client.channels.cache.get(env.CHANNEL_RULES)!.toString();
  const channelBotspam = message.client.channels.cache.get(env.CHANNEL_BOTSPAM)!.toString();
  const channelTechhelp = message.client.channels.cache.get(env.CHANNEL_TECHHELP)!.toString();
  // const channelHowToTripsit = message.client.channels.cache.get(env.CHANNEL_HOWTOTRIPSIT)!.toString();
  const channelTripsit = message.client.channels.cache.get(env.CHANNEL_TRIPSIT)!.toString();
  // const channelRTripsit = message.client.channels.cache.get(env.CHANNEL_TRIPSIT)!.toString();
  const channelOpenTripsit = message.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT)!.toString();
  const channelOpenTripsit1 = message.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT1)!.toString();
  const channelOpenTripsit2 = message.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT2)!.toString();
  const channelSanctuary = message.client.channels.cache.get(env.CHANNEL_SANCTUARY)!.toString();
  const channelHrResources = message.client.channels.cache.get(env.CHANNEL_HRRESOURCES)!.toString();
  const channelDrugQuestions = message.client.channels.cache.get(env.CHANNEL_DRUGQUESTIONS)!.toString();
  // const channelGeneral = message.guild!.channels.cache.get(env.CHANNEL_GENERAL)!.toString();
  const channelPets = message.client.channels.cache.get(env.CHANNEL_PETS)!.toString();
  const channelFood = message.client.channels.cache.get(env.CHANNEL_FOOD)!.toString();
  const channelMusic = message.client.channels.cache.get(env.CHANNEL_MUSIC)!.toString();
  const channelMovies = message.client.channels.cache.get(env.CHANNEL_MOVIES)!.toString();
  const channelGaming = message.client.channels.cache.get(env.CHANNEL_GAMING)!.toString();
  const channelScience = message.client.channels.cache.get(env.CHANNEL_SCIENCE)!.toString();
  const channelCreative = message.client.channels.cache.get(env.CHANNEL_CREATIVE)!.toString();
  const channelMemes = message.client.channels.cache.get(env.CHANNEL_MEMES)!.toString();
  const channelTrivia = message.client.channels.cache.get(env.CHANNEL_TRIVIA)!.toString();
  const channelLounge = message.client.channels.cache.get(env.CHANNEL_LOUNGE)!.toString();
  const channelStims = message.client.channels.cache.get(env.CHANNEL_STIMULANTS)!.toString();
  const channelDepressants = message.client.channels.cache.get(env.CHANNEL_DEPRESSANTS)!.toString();
  const channelDissociatives = message.client.channels.cache.get(env.CHANNEL_DISSOCIATIVES)!.toString();
  const channelPsychedelics = message.client.channels.cache.get(env.CHANNEL_PSYCHEDELICS)!.toString();
  // const channelOpioids = message.client.channels.cache.get(env.CHANNEL_OPIATES)!.toString();
  const channelTrees = message.client.channels.cache.get(env.CHANNEL_TREES)!.toString();
  // const channelViplounge = message.client.channels.cache.get(env.CHANNEL_VIPLOUNGE)!.toString();
  // const channelAdultSwim = message.client.channels.cache.get(env.CHANNEL_ADULTSWIM)!.toString();
  // const channelGoldLounge = message.client.channels.cache.get(env.CHANNEL_GOLDLOUNGE)!.toString();
  // const channelTalkToTS = message.client.channels.cache.get(env.CHANNEL_TALKTOTS)!.toString();
  // const channelBestOf = message.client.channels.cache.get(env.CHANNEL_BESTOF)!.toString();
  // const channelKudos = message.client.channels.cache.get(env.CHANNEL_KUDOS)!.toString();
  // const channelCampfire = message.client.channels.cache.get(env.CHANNEL_HUB)!.toString();
  // const channelDevWelcome = message.client.channels.cache.get(env.CHANNEL_DEVWELCOME)!.toString();


  const kipp = stripIndents`
    ${happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 9).join(' ')}
    ${heartEmojis[Math.floor(Math.random() * heartEmojis.length)]}\
    Keep It Positive Please!\
    ${heartEmojis[Math.floor(Math.random() * heartEmojis.length)]}
    ${happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 9).join(' ')}`;

  const move = stripIndents`
      ${movingEmojis.sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}
      **It's good to get up and move every hour!**
      ${movingEmojis.sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}`;

  const hydrate = stripIndents`
      ${waterAndTeaEmojis.sort(() => 0.5 - Math.random()).slice(0, 14).join(' ')}
      ⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️
      ${waterAndTeaEmojis.sort(() => 0.5 - Math.random()).slice(0, 14).join(' ')}`;

  const hrAnnouncements = [
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
  ];

  const channelAnnouncments = [
    `You can change your color and mindset in the ${channelStart}`,
    `Stay up to date with TripSit news in ${channelAnnouncements}`,
    `Make sure to follow the ${channelRules}!`,
    `Test out bot commands in ${channelBotspam}!`,
    `Have an issue and need to talk with the team? Use ${channelTechhelp}!`,
    `Need help from a tripsitter? Use ${channelTripsit}!`,
    `${channelOpenTripsit}, ${channelOpenTripsit1}, and ${channelOpenTripsit2} are "communal" tripsit rooms!`,
    `Slowmode is enabled in ${channelSanctuary} to let people have a chill experience!`,
    `Check out harm reduction resources in ${channelHrResources}!`,
    `Ask questions about drugs in ${channelDrugQuestions} to make sure they're not lost!`,
    `Share pictures of your doggos, kittos and other creaturos in ${channelPets}!`,
    `Compare recipes and drool over someone's latest creation in ${channelFood}!`,
    `Share your favorite songs in ${channelMusic}!`,
    `Talk about your favorite shows/movies in ${channelMovies}!`,
    `Do you enjoy playing games? Join ${channelGaming} for gaming talk and join the TripSit Steam group!`,
    `Science enthusiasts of all types are welcome in ${channelScience}!`,
    `Show off your latest hobby, painting, or even song of your own making in ${channelCreative}!`,
    `Post your favorite memes in ${channelMemes}!`,
    `Prove your superiority in ${channelTrivia}!`,
    `Enjoy a more relaxed environment in ${channelLounge}!`,
    `Want to talk fast? Join ${channelStims}!`,
    `Opiate/benzo talk is welcome tin ${channelDepressants}!`,
    `Get real weird with it in ${channelDissociatives}!`,
    `Open your third eye in ${channelPsychedelics}!`,
    `Start a sesh in ${channelTrees}!`,
  ];

  const commandAnnouncements = [
    `Learn all </about:960180702333243452> the bot!`,
    `Convert between benzo dosages with </benzo_calc:1017060823279087659>!`,
    `While tripsit does not give free cake, you can set your </birthday:971807342255546378>!`,
    `I will always love </breathe:959196740194537474> 4 uwu`,
    // `</bridge:>`,
    `Report issues with the bot with </bug:966477926763757628>!`,
    `Pick between two options with </coinflip:1009840858478166037>`,
    `Pull up the full </combochart:970044826970099802>!`,
    `You can see how to </contact:959196740194537476> the team!`,
    `</convert:999465763209490482> different measurements!`,
    `Get </drug:997960179217879092> info on various substances!`,
    `Use </dxm_calc:1017060823279087658> to get a DXM dosage!`,
    `Get </ems:966500308048031755> information if you need it!`,
    `Get really good at </eyeballing:1019720888544935946>!`,
    `Overwhelmed? Use and follow </grounding:1019720888544935947>`,
    `Check your sparkle points with </h2flow:984560964051537972>`,
    `Get info on every command with </help:966477926763757629>`,
    `Remind others to </hydrate:959196740194537477>`,
    `Track your dosages privately with </idose:1009840858478166041>`,
    `Search movies/tv with </imdb:1019325689767411824>`,
    `Search images with </imgur:1009840858478166039>`,
    `Pull up a (hopefully) fully </joke:1009840858478166042>`,
    `Check how much </karma:1020034430103982122> you've given/sent!`,
    `Calculate a ketamine dosage with </ketamine_calc:1017060823279087660>`,
    `Remind everyone to Keep It Positive Please! (</kipp:1009840858478166043>)`,
    `Send love to the channel with </lovebomb:1009840858478166044>`,
    `Ask a question, get a response from god: </magick8ball:1017060823279087662>`,
    `Start your own </poll:1009840858998251601>`,
    `Check out stats in your </profile:983483831925497890>`,
    `Determine psychedelic dosages with </psychedelic_calc:1017060823279087661>`,
    `Show a reagent chart with </reagents:969761968586100799>`,
    `When necessary, lay down in the </recovery:966500308048031756> position to stay safe!`,
    `Set reminders with </remindme:1009840858998251602>`,
    `Someone causing issues? </report:966403343746490504> them!`,
    `Set your </timezone:1020034430103982123> to let people know when you're sleeping!`,
    `Pull up a random topic with </topic:1009840858478166040>`,
    `Play with various </triptoys:1009840858998251603>`,
    `Check the definition of something with </urban_define:1009840858998251604>`,
    `Want to talk but dont need help? Try a </warmline:1009840858998251605>`,
    `Seach </youtube:1017060823279087663> for a fun video`,
  ];

  const funAnnouncements = [
    'Did you know that platypus venom can cause extreme sensitivity to pain, which can last for months and isn\'t even alleviated by morphine? TripSit recommends staying away from platypi, especially under the influence of drugs.',
    'If Tripbot starts speaking to you in a language other than English, you may need medical attention, please seek help!',
    'Did you know that the average human body contains enough iron to make a nail 3 inches long?',
  ];

  // const vipAnnouncements = [
  //   `Help out your fellow humans by reading ${channelHowToTripsit} and pick up the helper role to help in ${channelTripsit}!`,
  //   `You must be VIP to enter the ${channelViplounge}, it's meant to be more calm and a step away from ${channelGeneral}chat.`,
  //   `Talk about more mature topics (but not porn) in ${channelAdultSwim}!`,
  //   `Donate via the patreon or give our discord a boost to access the #gold-lounge ${channelGoldLounge}room, where everything is better because you paid for it!`,
  //   `Team Tripsit is always happy to hear your feedback, join #talk-to-tripsit ${channelTalkToTS}and say hi!`,
  //   `Upvote something 10 times to make it into the ${channelBestOf}`,
  //   `Give thanks and positive feedback in ${channelKudos}`,
  //   `Open a voice chat in ${channelCampfire}!`,
  //   `Want to help out tripsit 'behind the scenes'? Review the #vip-welcome ${channelDevWelcome} room and pick up the Consultant role to access the Development category where we discuss projects and ideas! You don't need to be a coder to be Headers, all input is welcome`,
  // ];

  const embed = embedTemplate();

  const genAnnouncements = hrAnnouncements.concat(
      hrAnnouncements,
      channelAnnouncments,
      commandAnnouncements,
      funAnnouncements,
  );

  // const allAnncouneemnts = [
  //   genAnnouncements,
  //   vipAnnouncements,
  // ];

  const generalChatCategories = [
    env.CATEGORY_BACKSTAGE,
    env.CATEGORY_CAMPGROUND,
    env.CATEGORY_VIPCABINS,
  ];

  logger.debug(`[${PREFIX}] instance of TextChannel: ${message.channel instanceof TextChannel}`);
  if (message.channel instanceof TextChannel) {
    logger.debug(`[${PREFIX}] message.channel.parentId: ${message.channel.parentId}`);
    if (message.channel.parentId) {
      logger.debug(`[${PREFIX}] generalChatCategories: ${generalChatCategories}`);
      logger.debug(`[${PREFIX}] generalChatCategories.includes(message.channel.parentId): ${generalChatCategories.includes(message.channel.parentId)}`);
      if (generalChatCategories.includes(message.channel.parentId)) {
        messageCounter[message.channel.id] = messageCounter[message.channel.id] ?
        messageCounter[message.channel.id] + 1 :
        1;

        if (messageCounter[message.channel.id] % frequency === 0) {
          // If the number of messages sent in the channel / by (frequency) has no remainder..

          const randomGenNumber = Math.floor(Math.random() * genAnnouncements.length);
          // const randomVipNumber = Math.floor(Math.random() * allAnncouneemnts.length);

          const randomGenAnnouncement = genAnnouncements[randomGenNumber];
          // const randomVipAnnouncement = allAnncouneemnts[randomVipNumber];
          const hydration = randomGenNumber === 0 ? true : false;

          logger.debug(`[${PREFIX}] randomGenAnnouncement: ${randomGenAnnouncement}`);
          embed.setDescription(randomGenAnnouncement);

          if (hydration) {
            embed.setAuthor(null);
            embed.setFooter({text: 'React to get your sparkle points for the /h2flow club!'});
            await (message.channel as TextChannel).send({embeds: [embed]})
                .then(async (msg) => {
                  await msg.react('💧');
                });
            return;
          }

          if (randomGenAnnouncement) {
            (message.channel as TextChannel).send({embeds: [embed]});
          }
        }
      }
    }
  }

  // logger.debug(`${PREFIX} - messageCounter: ${JSON.stringify(messageCounter, null, 2)}`);
  // logger.debug(`[${PREFIX}] messageCounter: ${messageCounter}`);
  // logger.debug(`[${PREFIX}] finished!`);
};
