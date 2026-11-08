/* eslint-disable max-len */
import {
  DMChannel,
  Message,
  MessageReaction,
  TextChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { embedTemplate } from './embedTemplate';
import { fact } from '../../global/commands/g.fact';

const F = f(__filename); // eslint-disable-line

const frequency = env.NODE_ENV === 'production' ? 100 : 1000;
const bigFrequency = env.NODE_ENV === 'production' ? 500 : 2000;
const messageCounter = {} as MessageCounterType;
let bigFrequencyCounter = 0;

/**
 * @param {number} ms
 * @return {Promise<void>}
 */
// function sleep(ms:number):Promise<void> {
//   return new Promise(resolve => {
//     setTimeout(resolve, ms);
//   });
// }

const waterAndTeaEmojis = [
  // '🏊', '🏊🏻', '🏊🏼', '🏊🏽', '🏊🏾', '🏊🏿',
  // '🏄', '🏄🏻', '🏄🏼', '🏄🏽', '🏄🏾', '🏄🏿',
  // '🚣', '🚣🏻', '🚣🏼', '🚣🏽', '🚣🏾', '🚣🏿',
  // '🤽', '🤽🏻', '🤽🏼', '🤽🏽', '🤽🏾', '🤽🏿',
  // '🛀', '🛀🏻', '🛀🏼', '🛀🏽', '🛀🏾', '🛀🏿',
  '💧', '🌊', '💦', '🧊',
  '💧', '🌊', '💦', '🧊',
  // '🧖‍♂️', '🧖🏻‍♂️', '🧖🏼‍♂️', '🧖🏽‍♂️', '🧖🏾‍♂️', '🧖🏿‍♂️',
  // '🧖‍♀️', '🧖🏻‍♀️', '🧖🏼‍♀️', '🧖🏽‍♀️', '🧖🏾‍♀️', '🧖🏿‍♀️',
  '🥛', '☕', '🍵', '🥤', '🧃', '🧉',
  '🥛', '☕', '🍵', '🥤', '🧃', '🧉',
  // '🚤', '🛳', '⛴', '🚢', '🍼',
];

const movingEmojis = [
  '🏃', '🏃‍♂️', '🏃‍♀️', '🏃🏽', '🏃🏾', '🏃🏿',
  '🚴', '🚴🏻', '🚴🏼', '🚴🏽', '🚴🏾', '🚴🏿',
  '🚵', '🚵🏻', '🚵🏼', '🚵🏽', '🚵🏾', '🚵🏿',
  '⛹', '⛹🏻', '⛹🏼', '⛹🏽', '⛹🏾', '⛹🏿',
  '🤸', '🤸🏻', '🤸🏼', '🤸🏽', '🤸🏾', '🤸🏿',
  '🤾', '🤾🏻', '🤾🏼', '🤾🏽', '🤾🏾', '🤾🏿',
  '🤹', '🤹🏻', '🤹🏼', '🤹🏽', '🤹🏾', '🤹🏿',
  '🧘', '🧘🏻', '🧘🏼', '🧘🏽', '🧘🏾', '🧘🏿',
  '🏌', '🏌️‍♂️', '🏌️‍♀️', '🏌🏽', '🏌🏾', '🏌🏿',
  '🤾', '🤾🏻', '🤾🏼', '🤾🏽', '🤾🏾', '🤾🏿',
  '🚶‍♂️', '🚶‍♀️', '🚶🏽', '🚶🏾', '🚶🏿', '🤼',
  '🏇', '🏂', '🤺', '🏋', '🏋‍♂️', '🏋‍♀️',
  '🧎', '🧎‍♂️', '🧎‍♀️', '💃', '🕺', '🕴',
];

const happyEmojis = [
  '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
  '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
  '😎', '😺', '😸', '😹', '😻', '🐵', '👍', '✌',
];

type MessageCounterType = {
  [key: string]: number;
};

/**
 *
 * @param {Message} message
 */
export async function announcements(message:Message) {
  const hrAnnouncements = [
    '**Reminder:** For the safety of everyone involved, sourcing (buying or selling anything) is against our network rules. If someone contacts you to find, buy, trade, or give you drugs, you can report it by using /report or by clicking their name > Apps > TripBot Report User. This rule also applies to private messages. Be safe, and don\'t trust random internet folk.',
    '**Reminder:** Tending to personal hygiene is an important part of self-care. Remember to brush your teeth, bathe, and wash your hands!',
    '**Reminder:** We do our best to keep the environment here as safe as possible but please remember to always be vigilant when using the internet. Do not post anything here that might divulge any of your personal information.',
    '**Reminder:** Sleep is important! A sleep deficit can impair you more than drinking alcohol.',
    '**Reminder:** Stay hydrated! Drinking water is essential for your body and mind to function properly.',
    '**Reminder:** Regular exercise can help reduce stress and improve your mood. Try to incorporate some form of physical activity into your daily routine.',
    '**Reminder:** Eating a balanced diet is key to maintaining good health. Try to include fruits and vegetables in your meals regularly.',
    '**Reminder:** Be respectful and considerate in your interactions with others online. Everyone is here for a good time!',
    '**Reminder:** Protect your personal information online. Avoid sharing sensitive details no matter who you are talking to.',
    '**Reminder:** Always research any substances you plan to take. Understanding the effects and potential risks can help you make safer choices.',
    '**Reminder:** Remember to take regular breaks when using screens for a long period of time to avoid eye strain.',
    '**Reminder:** TripSit strives to be a safe place for everyone. Please be kind and report any inappropriate behavior.',
    '**Reminder:** Spending time outdoors is proven to have a positive impact on your mental health. Try to get some fresh air every day!',
    '**Reminder:** If you are feeling overwhelmed or anxious, take a moment to breathe deeply and focus on the present.',
    '**Reminder:** Make sure you have taken care of your responsibilities before using substances.',
    '**Reminder:** Try to maintain a regular sleep schedule. Consistent sleep patterns can improve your overall health.',
    '**Reminder:** 20-20-20! Every 20 minutes, take 20 seconds to look at something 20 feet away. This can help reduce eye strain from screens.',
    '**Reminder:** It is important to take your medication as prescribed. If you have any concerns, please speak to your healthcare provider instead of deviating from your prescription.',
    '**Reminder:** Sometimes it can be healthy to take a break from online drug focused communities. It is okay to step back to help focus on other things.',
    '**Reminder:** Please be mindful of the jokes you make here. What may be funny to you could be hurtful to someone else with lived experience.',
    '**Reminder:** If one channel is too busy, try striking conversation in another! There are many different channels to choose from.',
    '**Reminder:** What is your habit really costing you? Never be discouraged to seek help if you need it.',
    '**Reminder:** Know your source and only consider a substance tested if you have witnessed it with your own eyes!',
    '**Reminder:** Start low, go slow. You can choose to take more later, you cannot choose to take less!',
    '**Reminder:** Driving under the influence is never justified. Consider other people and their wellbeing before making decisions!',
    '**Reminder:** Carry naloxone if using opioids, and know how to use it in an emergency.',
    '**Reminder:** Share your plans with a trusted friend so someone knows to check in on you.',
    '**Reminder:** It\'s okay to say no. Never feel pressured to use more than you want. Peer pressuring is for losers!',
    '**Reminder:** If in doubt, throw it out. Don\'t take risks with unknown or suspicious substances.',
    '**Reminder:** Take breaks and rest when needed. Listen to your body and don\'t push your limits.',
    '**Reminder:** Health checks are important to catch issues early! Make sure to try to see a dentist at least once a year, an optometrist every two years and an audiologist every five years.',
  ];

  const tipAnnouncements = [
    '**Tip:** You can report a user if they are breaking the rules or causing issues by using /report or by right-clicking their name > Apps > TripBot Report User.',
    '**Tip:** To report a user, click their name > Apps > TripBot Report User. To report a message, right-click the message > Apps > TripBot Report Message.',
    '**Tip:** Use `/help` to learn more about the bot and its commands.',
    '**Tip:** Check out the <id:guide> for more tips and server info!',
    '**Tip:** Go to <id:customize> to change your name color and mindset role icon!',
    '**Tip:** Use the "ephemeral" option in TripBot commands to use them privately.',
    '**Tip:** Earn TripTokens in `/rpg` to buy customization items for your `/profile`!',
    '**Tip:** Head to the Activities Corner in the <id:guide> for small games and activities!',
    '**Tip:** Curious about a specific server function like levelling or karma? Head to Server Tips in the <id:guide>!',
    '**Tip:** Keen to help with tripsitting? Head to the <id:guide> for info on how to become a Helper!',
    '**Tip:** We are looking for Tripsitters! Check out the <id:guide> to learn how to become a Helper!',
    '**Tip:** Track your dosages privately with `/idose`.',
    '**Tip:** Feeling a little airy? Use `/breathe` to guide your breathing.',
    '**Tip:** Feeling a bit spacey? Try `/grounding` to bring you back down to earth.',
    '**Tip:** Conversation a bit dull? Use `/topic` to get a random topic to chat about!',
    '**Tip:** Need a little pick-me-up? Use `/lovebomb` to send some love to the channel!',
    '**Tip:** Want to know how much karma you\'ve given or received? Use `/karma`!',
    '**Tip:** Need to force yourself to take a break? Use `/selftimeout`.',
    '**Tip:** Want to see a reagent chart? Use `/reagents`!',
    '**Tip:** Get quick access to the combo chart with `/combochart`!',
    '**Tip:** Convert one benzo dosage to another with `/calc benzo`.',
    '**Tip:** Need some quick activities? Head over to Rooni\'s Fun Activities Corner in the <id:guide>!',
    '**Tip:** Want to know what is happening behind the scenes? Check out the <id:guide> for info on our development projects!',
  ];

  const funAnnouncements = [
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/largest-sandwich) The largest sandwich ever made weighed 2,467kg (5,440 lb) and was close to half a metre thick!.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/longest-sausage) The longest sausage ever made was 62.75km (38.99 miles) long.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/largest-pizza) The largest pizza ever made was 1,296.72 m² (13,957.77 ft²) and included over 630,000 pepperoni slices!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/111847-longest-jump-by-a-cat) The longest jump by a cat is 230 cm (7 ft 6.551 in) achieved by Sputnik the cat.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/largest-collection-of-rubber-ducks) The largest collection of rubber ducks is 5,631.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/oldest-message-in-a-bottle) The oldest message in a bottle spent 131 years, 223 days at sea.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/fastest-time-to-eat-a-bowl-of-pasta) The fastest time to eat a bowl of pasta is 17.03 seconds.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/most-ice-cream-scoops-balanced-on-a-cone) The most ice cream scoops balanced on a cone is 125.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/largest-collection-of-pokemon-memorabilia) The largest collection of Pokémon memorabilia is 17,127 items.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/69605-longest-conga-line) The record for the longest conga line is 119,986 people.',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/longest-cake) The longest cake ever made was 5300m (17,388 ft) long, and was eaten in 10 minutes!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/heaviest-train-pulled-with-beard) The heaviest train pulled with a beard weighed 2,753kg (6,069 lb)!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/70851-largest-cow-ever) The tallest cow recorded was "Blossom" who stood at 190cm (74.8 in) tall!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/372384-fastest-marathon-dressed-as-an-elf-male) The fastest marathon dressed as an elf is 2 hours, 56 minutes!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/longest-noodle) The longest noodle ever made was 3,084m (10,119 ft) long!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/103131-most-spoons-balanced-on-the-body) The most spoons balanced on a human body is 96!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/most-t-shirts-worn-at-once) The most t-shirts worn at once is 260!',
    '[**Did you know?**](https://www.guinnessworldrecords.com/world-records/80129-loudest-burp-male) The loudest burp is 112.4 decibels!',
  ];

  const embed = embedTemplate();

  const genAnnouncements = [hrAnnouncements, tipAnnouncements, funAnnouncements].flat(1);

  const generalChatCategories = [
    env.CATEGORY_CAMPGROUND,
  ];

  if (message.channel.id === env.CHANNEL_SANCTUARY
    || message.channel.id === env.CHANNEL_CLEARLOUNGE) {
    return;
  }

  // log.debug(F, `instance of TextChannel: ${message.channel instanceof TextChannel}`);
  if (message.channel instanceof TextChannel
    && message.channel.parentId
    && generalChatCategories.includes(message.channel.parentId)) {
    // log.debug(F, `message.channel.parentId: ${message.channel.parentId}`);
    // log.debug(F, `generalChatCategories: ${generalChatCategories}`);
    // log.debug(F, `generalChatCategories.includes(message.channel.parentId): ${generalChatCategories.includes(message.channel.parentId)}`);
    messageCounter[message.channel.id] = messageCounter[message.channel.id]
      ? messageCounter[message.channel.id] + 1
      : 1;

    // log.debug(F, `messageCounter[message.channel.id]: ${messageCounter[message.channel.id]}`);
    // log.debug(F, `bigFrequency: ${bigFrequency}`);
    // log.debug(F, `${messageCounter[message.channel.id] % bigFrequency === 0}`);
    // log.debug(F, `frequency: ${frequency}`);
    // log.debug(F, `${messageCounter[message.channel.id] % frequency === 0}`);
    if (messageCounter[message.channel.id] % bigFrequency === 0) {
      const bigAnnouncementDict = {
        0: {
          message: stripIndents`
                ${[...happyEmojis].sort(() => 0.5 - Math.random()).slice(0, 14).join(' ')}
                **Please remember to KIPP - Keep It Positive Please!**
                We're all here to help each other and have fun!
                ${[...happyEmojis].sort(() => 0.5 - Math.random()).slice(0, 14).join(' ')}`,
          footer: 'Send a ❤ to someone and react to get /h2flow points!',
          emoji: '❤',
        },
        1: {
          message: stripIndents`
              ${[...movingEmojis].sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}
              **It's good to get up and move every hour!**
              Take a break, stretch, and get some fresh air!
              ${[...movingEmojis].sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}`,
          footer: 'Get up, move around and react to get /h2flow points!',
          emoji: '🕴',
        },
        2: {
          message: stripIndents`
              ${[...waterAndTeaEmojis].sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}
              ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ
              Doesn't some water sound great right now?
              ${[...waterAndTeaEmojis].sort(() => 0.5 - Math.random()).slice(0, 12).join(' ')}`,
          footer: 'Take a sip of something and react to get /h2flow points!',
          emoji: '💧',
        },
      };

      bigFrequencyCounter += 1;
      if (bigFrequencyCounter > 2) {
        bigFrequencyCounter = 0;
      }

      embed.setAuthor(null);
      embed.setFooter({ text: bigAnnouncementDict[bigFrequencyCounter as keyof typeof bigAnnouncementDict].footer });
      embed.setDescription(bigAnnouncementDict[bigFrequencyCounter as keyof typeof bigAnnouncementDict].message);
      await message.channel.send({ embeds: [embed] })
        .then(async msg => {
          await msg.react(bigAnnouncementDict[bigFrequencyCounter as keyof typeof bigAnnouncementDict].emoji);
          const filter = (reaction:MessageReaction) => reaction.emoji.name === bigAnnouncementDict[bigFrequencyCounter as keyof typeof bigAnnouncementDict].emoji;
          const collector = msg.createReactionCollector({ filter, time: 0, dispose: true });

          const pointDict = {
            '❤': 'empathy_points',
            '🕴': 'move_points',
            '💧': 'sparkle_points',
          };

          collector.on('collect', async (reaction, user) => {
            const pointType = pointDict[reaction.emoji.name as keyof typeof pointDict];
            await db.users.upsert({
              where: {
                discord_id: user.id,
              },
              create: {
                discord_id: user.id,
                [pointType]: 1,
              },
              update: {
                [pointType]: {
                  increment: 1,
                },
              },
            });
          });

          collector.on('remove', async (reaction, user) => {
            const pointType = pointDict[reaction.emoji.name as keyof typeof pointDict];
            // Increment the users's pointType

            await db.users.upsert({
              where: {
                discord_id: user.id,
              },
              create: {
                discord_id: user.id,
                [pointType]: -1,
              },
              update: {
                [pointType]: {
                  increment: -1,
                },
              },
            });
            // log.debug(F, `${user.tag} ${pointType} decremented to ${value[0][pointType as keyof typeof value[0]]}`);
          });
        });
    } else if (messageCounter[message.channel.id] % frequency === 0) {
      // If the number of messages sent in the channel / by (frequency) has no remainder..

      // log.debug(F, `genAnnouncements.length: ${genAnnouncements.length}`);

      const randomGenNumber = Math.floor(Math.random() * (genAnnouncements.length));

      // log.debug(F, `randomGenNumber: ${randomGenNumber}`);

      if (randomGenNumber === genAnnouncements.length) {
        embed.setDescription(await fact());
      } else {
        const randomGenAnnouncement = genAnnouncements[randomGenNumber];
        // log.debug(F, `randomGenAnnouncement: ${randomGenAnnouncement}`);
        embed.setDescription(randomGenAnnouncement);
      }
      await message.channel.sendTyping(); // This method automatically stops typing after 10 seconds, or when a message is sent.
      setTimeout(async () => {
        if (message.channel instanceof TextChannel || message.channel instanceof DMChannel) {
          await (message.channel.send({ embeds: [embed] }));
        } else log.error(F, 'Cannot send typing in this channel type.');
      }, 3000);
    }
  }
}

export default announcements;
