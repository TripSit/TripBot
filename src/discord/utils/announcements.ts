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
  // // const channelStart = await message.client.channels.fetch(env.CHANNEL_START) as TextChannel;
  // const channelAnnouncements = await message.client.channels.fetch(env.CHANNEL_ANNOUNCEMENTS) as TextChannel;
  // const channelRules = await message.client.channels.fetch(env.CHANNEL_RULES) as TextChannel;
  // const channelBotspam = await message.client.channels.fetch(env.CHANNEL_BOTSPAM) as TextChannel;
  // const channelTechhelp = await message.client.channels.fetch(env.CHANNEL_HELPDESK) as TextChannel;
  // // const channelHowToTripsit = await message.client.channels.fetch(env.CHANNEL_HOWTOTRIPSIT) as TextChannel;
  // const channelTripsit = await message.client.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
  // // const channelRTripsit = await message.client.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
  // const channelOpenTripsit1 = await message.client.channels.fetch(env.CHANNEL_OPENTRIPSIT1) as TextChannel;
  // const channelOpenTripsit2 = await message.client.channels.fetch(env.CHANNEL_OPENTRIPSIT2) as TextChannel;
  // const channelSanctuary = await message.client.channels.fetch(env.CHANNEL_SANCTUARY) as TextChannel;
  // const channelHrResources = await message.client.channels.fetch(env.CHANNEL_HRRESOURCES) as TextChannel;
  // const channelDrugQuestions = await message.client.channels.fetch(env.CHANNEL_DRUGQUESTIONS) as TextChannel;
  // // const channelGeneral = await message.guild.channels.fetch(env.CHANNEL_GENERAL) as TextChannel;
  // const channelPets = await message.client.channels.fetch(env.CHANNEL_PETS) as TextChannel;
  // const channelFood = await message.client.channels.fetch(env.CHANNEL_FOOD) as TextChannel;
  // const channelMusic = await message.client.channels.fetch(env.CHANNEL_MUSIC) as TextChannel;
  // const channelMovies = await message.client.channels.fetch(env.CHANNEL_MOVIES) as TextChannel;
  // const channelGaming = await message.client.channels.fetch(env.CHANNEL_GAMING) as TextChannel;
  // const channelScience = await message.client.channels.fetch(env.CHANNEL_SCIENCE) as TextChannel;
  // const channelCreative = await message.client.channels.fetch(env.CHANNEL_CREATIVE) as TextChannel;
  // const channelMemes = await message.client.channels.fetch(env.CHANNEL_MEMES) as TextChannel;
  // const channelTrivia = await message.client.channels.fetch(env.CHANNEL_TRIVIA) as TextChannel;
  // const channelLounge = await message.client.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
  // const channelStims = await message.client.channels.fetch(env.CHANNEL_STIMULANTS) as TextChannel;
  // const channelDepressants = await message.client.channels.fetch(env.CHANNEL_DEPRESSANTS) as TextChannel;
  // const channelDissociatives = await message.client.channels.fetch(env.CHANNEL_DISSOCIATIVES) as TextChannel;
  // const channelPsychedelics = await message.client.channels.fetch(env.CHANNEL_PSYCHEDELICS) as TextChannel;
  // const channelOpioids = await message.client.channels.fetch(env.CHANNEL_OPIATES) as TextChannel;
  // const channelTrees = await message.client.channels.fetch(env.CHANNEL_TREES) as TextChannel;
  // // const channelViplounge = await message.client.channels.fetch(env.CHANNEL_VIPLOUNGE) as TextChannel;
  // // const channelAdultSwim = await message.client.channels.fetch(env.CHANNEL_REALTALK) as TextChannel;
  // // const channelGoldLounge = await message.client.channels.fetch(env.CHANNEL_GOLDLOUNGE) as TextChannel;
  // // const channelTalkToTS = await message.client.channels.fetch(env.CHANNEL_SUGGESTIONS) as TextChannel;
  // const channelBestOf = await message.client.channels.fetch(env.CHANNEL_BESTOF) as TextChannel;
  // const channelKudos = await message.client.channels.fetch(env.CHANNEL_KUDOS) as TextChannel;
  // const channelCampfire = await message.client.channels.fetch(env.CHANNEL_CAMPFIRE) as TextChannel;
  // // const channelDevWelcome = await message.client.channels.fetch(env.CHANNEL_DEVWELCOME) as TextChannel;

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
    '**Tip:** Check out our wiki and the web version of our drug factsheets and combo info at tripsit.me!',
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

  // const chanAnnouncements = [
  //   // `You can change your color and mindset in the ${channelStart.toString()}`,
  //   `Stay up to date with TripSit news in ${channelAnnouncements.toString()}`,
  //   `Make sure to follow the ${channelRules.toString()}!`,
  //   `Test out bot commands in ${channelBotspam.toString()}!`,
  //   `Have an issue and need to talk with the team? Use ${channelTechhelp.toString()}`,
  //   `Need help from a tripsitter? Use ${channelTripsit.toString()}!`,
  //   `${channelOpenTripsit1.toString()} and ${channelOpenTripsit2.toString()} are "communal" tripsit rooms! You can get help from the community here!`,
  //   `Slowmode is enabled in ${channelSanctuary.toString()} to let people have a chill experience!`,
  //   `Check out harm reduction resources in ${channelHrResources.toString()}!`,
  //   `Ask questions about drugs in ${channelDrugQuestions.toString()} to make sure they're not lost!`,
  //   `Share pictures of your doggos, kittos and other creaturos in ${channelPets.toString()}!`,
  //   `Compare recipes and drool over someone's latest creation in ${channelFood.toString()}!`,
  //   `Share your favorite songs in ${channelMusic.toString()}!`,
  //   `Talk about your favorite shows/movies in ${channelMovies.toString()}!`,
  //   `Do you enjoy playing games? Join ${channelGaming.toString()} for gaming talk and join the TripSit Steam group!`,
  //   `Science enthusiasts of all types are welcome in ${channelScience.toString()}!`,
  //   `Show off your latest hobby, painting, or even song of your own making in ${channelCreative.toString()}!`,
  //   `Post your favorite memes in ${channelMemes.toString()}!`,
  //   `Prove your superiority in ${channelTrivia.toString()}!`,
  //   `Enjoy a more relaxed environment in ${channelLounge.toString()}!`,
  //   `Want to talk fast? Join ${channelStims.toString()}!`,
  //   `Benzo/deliriant/alcohol talk is welcome in ${channelDepressants.toString()}!`,
  //   `Opiate talk is welcome in ${channelOpioids.toString()}!`,
  //   `Get real weird with it in ${channelDissociatives.toString()}!`,
  //   `Open your third eye in ${channelPsychedelics.toString()}!`,
  //   `Start a sesh in ${channelTrees.toString()}!`,
  //   `If something gets 5 upvotes it will be posted to ${channelBestOf.toString()}!`,
  //   `Want to recognize someone for their help? Give them a ${channelKudos.toString()}!`,
  //   `You can start your own voice chat by joining ${channelCampfire.toString()}!`,
  // ];

  // const commandAnnouncements = [
  //   `Learn all </about:960180702333243452> the bot!`,
  //   `Convert between benzo dosages with </benzo_calc:1017060823279087659>!`,
  // 'While tripsit does not give free cake, you can set your </birthday:971807342255546378>!',
  // 'I will always love </breathe:959196740194537474> 4',
  //   // `</bridge:>`,
  // `Report issues with the bot with </bug:966477926763757628>!`,
  //   `Pick between two options with </coinflip:1009840858478166037>`,
  //   `Pull up the full </combochart:970044826970099802>!`,
  //   `You can see how to </contact:959196740194537476> the team!`,
  //   `</convert:999465763209490482> different measurements!`,
  //   `Get </drug:997960179217879092> info on various substances!`,
  //   `Use </dxm_calc:1017060823279087658> to get a DXM dosage!`,
  //   `Get </ems:966500308048031755> information if you need it!`,
  //   // `Get really good at </eyeballing:1019720888544935946>!`,
  //   `Overwhelmed? Use and follow </grounding:1019720888544935947>`,
  //   `Check your sparkle points with </h2flow:984560964051537972>`,
  //   `Get info on every command with </help:966477926763757629>`,
  //   `Remind others to </hydrate:959196740194537477>`,
  //   `Track your dosages privately with </idose:1009840858478166041>`,
  //   `Search movies/tv with </imdb:1019325689767411824>`,
  //   `Search images with </imgur:1009840858478166039>`,
  //   `Pull up a (hopefully) fully </joke:1009840858478166042>`,
  //   `Check how much </karma:1020034430103982122> you've given/sent!`,
  //   `Calculate a ketamine dosage with </ketamine_calc:1017060823279087660>`,
  //   `Remind everyone to Keep It Positive Please! (</kipp:1009840858478166043>)`,
  //   `Send love to the channel with </lovebomb:1009840858478166044>`,
  //   `Ask a question, get a response from god: </magick8ball:1017060823279087662>`,
  //   `Start your own </poll:1009840858998251601>`,
  //   `Check out stats in your </profile:983483831925497890>`,
  //   `Determine psychedelic dosages with </psychedelic_calc:1017060823279087661>`,
  //   `Show a reagent chart with </reagents:969761968586100799>`,
  //   `When necessary, lay down in the </recovery:966500308048031756> position to stay safe!`,
  //   `Set reminders with </remind_me:1009840858998251602>`,
  //   `Someone causing issues? </report:966403343746490504> them!`,
  //   `Set your </timezone:1020034430103982123> to let people know when you're sleeping!`,
  //   `Pull up a random topic with </topic:1009840858478166040>`,
  //   `Play with various </triptoys:1009840858998251603>`,
  //   `Check the definition of something with </urban_define:1009840858998251604>`,
  //   `Want to talk but don't need help? Try a </warmline:1009840858998251605>`,
  //   `Search </youtube:1017060823279087663> for a fun video`,
  // ];

  // const vipAnnouncements = [
  //   `Help out your fellow humans by reading ${channelHowToTripsit} and pick up the helper role to help in ${channelTripsit}!`,
  //   `You must be VIP to enter the ${channelViplounge}, it's meant to be more calm and a step away from ${channelGeneral}chat.`,
  //   `Talk about more mature topics (but not porn) in ${channelAdultSwim}!`,
  //   `Donate via the patreon or give our discord a boost to access the #gold-lounge ${channelGoldLounge}room, where everything is better because you paid for it!`,
  //   `Team Tripsit is always happy to hear your feedback, join #talk-to-tripsit ${channelTalkToTS}and say hi!`,
  //   `Upvote something 10 times to make it into the ${channelBestOf}`,
  //   `Give thanks and positive feedback in ${channelKudos}`,
  //   `Open a voice chat in ${channelCampfire}!`,
  //   `Want to help out tripsit 'behind the scenes'? Review the #vip-welcome ${channelDevWelcome} room and pick up the Contributor role to access the Development category where we discuss projects and ideas! You don't need to be a coder to be Headers, all input is welcome`,
  // ];

  const embed = embedTemplate();

  const genAnnouncements = [hrAnnouncements, tipAnnouncements, funAnnouncements].flat(1);

  // const allAnnouncements = [
  //   genAnnouncements,
  //   vipAnnouncements,
  // ];

  const generalChatCategories = [
    env.CATEGORY_BACKSTAGE,
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
