const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;

const button1 = new MessageButton()
    .setCustomId('previousbtn')
    .setLabel('Previous')
    .setStyle('DANGER');

const button2 = new MessageButton()
    .setCustomId('nextbtn')
    .setLabel('Next')
    .setStyle('SUCCESS');
const buttonList = [
    button1,
    button2,
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('karma')
        .setDescription('Keep it positive please!')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to lookup!')
            ,
        ),
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        let patient = interaction.options.getMember('user');
        // let user_provided = true;
        // Default to the user who invoked the command if no user is provided
        if (!patient) {
            logger.debug(`[${PREFIX}] No user provided, defaulting to ${interaction.member}`);
            patient = interaction.member;
            // user_provided = false;
        }

        const patientid = patient.id.toString();
        logger.debug(`[${PREFIX}] patientid: ${patientid}`);

        const db_name = 'ts_data.json';
        const RAW_TS_DATA = fs.readFileSync(`./src/data/${db_name}`);
        const ALL_TS_DATA = JSON.parse(RAW_TS_DATA);
        // logger.debug(`[${PREFIX}] ALL_TS_DATA: ${JSON.stringify(ALL_TS_DATA, null, 4)}`);

        let patientData = ALL_TS_DATA['users'][patientid];
        logger.debug(`[${PREFIX}] patientData: ${JSON.stringify(patientData, null, 4)}`);

        // Check if the patient data exists, if not create a blank one
        if (!patientData) {
            patientData = {
                'name': patient.user.username,
                'discriminator': patient.user.discriminator,
                'roles': [],
                'karma_given': {},
                'karma_received': {},
            };
        }

        const karma_received = patientData['karma_received'];
        let karma_received_string = '';
        if (karma_received) {
            karma_received_string = Object.entries(karma_received).map(([key, value]) => `${value}: ${key}`).join('\n');
        }
        else {
            karma_received_string = 'Nothing, they are a blank canvas to be discovered!';
        }

        const karma_given = patientData['karma_given'];
        let karma_given_string = '';
        if (karma_given) {
            karma_given_string = Object.entries(karma_given).map(([key, value]) => `${value}: ${key}`).join('\n');
        }
        else {
            karma_given_string = 'Nothing, they are a wet paintbrush ready to make their mark!';
        }

        const book = [];
        const karma_received_embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle(`${patient.user.username}'s Karma Received`)
            .setDescription(`${karma_received_string}\n\n${random_karma_quote()}`);
        book.push(karma_received_embed);

        const karma_given_embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle(`${patient.user.username}'s Karma Given`)
            .setDescription(`${karma_given_string}\n\n${random_karma_quote()}`);
        book.push(karma_given_embed);

        if (book.length > 0) {
            paginationEmbed(interaction, book, buttonList);
            return;
        }
        else {
            const embed = new MessageEmbed()
                .setColor('RANDOM')
                .setDescription('Done!');
            return interaction.reply({ embeds: [embed] });
        }

    },
};


function random_karma_quote() {
    const quotes = [
        '1. “A boomerang returns back to the person who throws it.” – Vera Nazarian',
        '2. “A man is born alone and dies alone; and he experiences the good and bad consequences of his karma alone; and he goes alone to hell or the Supreme abode.” — Chanakya',
        '3. “According to the karma of past actions, one’s destiny unfolds, even though everyone wants to be so lucky.” – Sri Guru Grant Sahib',
        '4. “As long as karma exists, the world changes. There will always be karma to be taken care of.”- Nina Hagen',
        '5. “As she has planted, so does she harvest; such is the field of karma.”- Sri Guru Granth Sahib',
        '6. “As the heat of fire reduces wood to ashes, the fire of knowledge burns to ashes all karma.” – Bhagavad Gita',
        '7. “Attachment and aversion are the root cause of karma, and karma originates from infatuation. Karma is the root cause of birth and death, and these are said to be the source of misery. None can escape the effect of their own past karma.” — Mahavira',
        '8. “Aversion is a form of bondage. We are tied to what we hate or fear. That is why, in our lives, the same problem, the same danger or difficulty, will present itself over and over again in various prospects, as long as we continue to resist or run away from it unread of examining it and solving it.” – Patanjali',
        '9. “Bad karma, but I don’t give a shit. Always been a savage, never been a average.” — London Alexis, Bad Karma/Bad Habits',
        '10. “Be kind to others, for everyone is fighting a battle.” – Unknown',
        '11. “Because Karma has a funny way of working. Don’t come to me when you get what you deserve.” — Zacarias Li Rose, Karma',
        '12. “Before you act, you have freedom, but after you act, the effect of that action will follow you whether you want it to or not. That is the law of karma.” – Paramahansa Yogananda',
        '13. “But keep in mind that karma, karma, karma. She’s gonna get ya and there’s nothing you can say.” — Aspen Wood, Karma',
        '14. “But now you want none of my life, it’s karma. Now you want none of my life, it’s karma. I couldn’t deal with my vice and the price I pay is you won’t come back, yeah.” — PLAZA, Karma',
        '15. “But this was what happened when you didn’t want to visit and confront the past: the past starts visiting and confronting you.” – Bret Easton Ellis',
        '16. “By each crime and every kindness, we birth our future.” – David Mitchell',
        '17. “By living Dharma there is no karma.” – Guru Gobindh Singh',
        '18. “Cause I been dreaming about these demons. I been thinking about these demons. Karma is gonna get me.” — Kristian Dior, Karma',
        '19. “Character is like a tree and reputation like a shadow. The shadow is what we think of it; the tree is the real thing.” – Abraham Lincoln',
        '20. “Constant kindness can accomplish much. As the sun makes ice melt, kindness causes misunderstanding, mistrust, and hostility to evaporate.”- Albert Schweitzer',
        '21. “Contrary to popular misconception, karma has nothing to do with punishment and reward. It exists as part of our holographic universe’s binary or dualistic operating system only to teach us responsibility for our creations – and all things we experience are our creations.”- Sol Luckman',
        '22. “Dear Karma, I really hate you right now, you made your point.”',
        '23. “Death is not the greatest loss in life. The greatest loss is what dies inside us while we live.” – Norman Cousins',
        '24. “Do bad and get bad because karma has no deadline.” – Priyanshu Singh',
        '25. “Do not attempt to help those who have not asked for your help. Interfering with their own karma will result in a never-ending spiritual war from which you can only lose.”― Robin Sacredfire',
        '26. “Do something good today and in the future you will get repaid with something good too. Do something good. Get something good.”',
        '27. “Don’t ever be mad at karma, she’s just doing her job.” — Unknown',
        '28. “Don’t judge each day by the harvest you reap but by the seeds that you plant.” – Robert Louis Stevenson',
        '29. “Don’t send me flowers when I’m dead. If you like me, send them while I’m alive.” – Brian Clough',
        '30. “Don’t waste time on revenge. The people who hurt you will eventually face their own karma.”- Author Unknown',
        '31. “Don’t worry, eventually everything falls into its rightful place.” ― Fakeer Ishavardas',
        '32. “Each individual is solely responsible for his or her own actions, and every action will produce a reaction equal in every way to the suit of the action.” – Stephen Arroyo',
        '33. “Even chance meetings are the result of karma… Things in life are fated by our previous lives. That even in the smallest events there’s no such thing as coincidence.”',
        '34. “Even chance meetings are the result of karma… Things in life are fated by our previous lives. That even in the smallest events there’s no such thing as coincidence.” – Haruki Murakami',
        '35. “Even death is not to be feared by one who has lived wisely. – Buddha',
        '36. “Even if things don’t unfold the way you expected, don’t be disheartened or give up.” – Daisaku Ikeda',
        '37. “Eventually you are answerable to yourself for your deeds. Be good and do good!”― Harsh Agrawal',
        '38. “Every action has equal and opposite reaction. This is law of the universe and spares none. Wrong done and injustice inflicted is paid back in the same coin. No one has escaped justice of the universe. It is only a matter of time.”- Anil Sinha',
        '39. “Every action of our lives touches on some chord that will vibrate in eternity.”- Edwin Hubbel Chapin',
        '40. “Everybody comes from the same source. If you hate another human being, you’re hating part of yourself.” – Elvis Presley',
        '41. “Everyone gets dumped and everyone gets hurt and there’s karma to love in regards to what you’ve done to other people.” – Marina and the Diamonds',
        '42. “Everything in your life is a reflection of a choice you have made. If you want a different result, then make a different choice.” – Unknown',
        '43. “For the innocent, the past may hold a reward. But for the treacherous, it’s only a matter of time before the past delivers what they truly deserve.” – Kevin McCarty',
        '44. “For the keynote of the law of Karma is equilibrium, and nature is always working to restore that equilibrium whenever through man’s acts it is disturbed.”',
        '45. “Forgive the person and their actions, never give in to hate. Let it go, set it free, and karma will take care of what is meant to be.” – Author Unknown',
        '46. “Give up the sense of doership. Karma will go on automatically. Or karma will drop away automatically.” – Ramana Maharishi',
        '47. “Give up your selfishness, and you shall find peace; like water mingling with water, you shall merge in absorption.”- Sri Guru Granth Sahib',
        '48. “He is unaffected by Karma, although engaged in action. Who has yoked himself to the way of yoga, whose mind is purified. Whose self has triumphed and whose senses have been subdued. And whose self indeed, become the self of all beings. Although acting he remains unaffected by karma” – Krishna',
        '49. “How people treat you is their karma; how you react is yours.” – Wayne Dyer',
        '50. “How people treat you is their karma; how you react is yours.”- Wayne Dyer',
        '51. “How wonderful it is that nobody need wait a single moment before starting to improve the world.” –Anne Frank',
        '52. “I believe in karma, and I believe if you put out positive vibes to everybody, that’s all you’re going to get back.” – Kesha',
        '53. “I believe in Karma. If the good is sown, the good is collected. When positive things are made, that returns well.”- Yannick Noah',
        '54. “I believe in karma; what you do will come back.” — DJ Premier',
        '55. “I do not believe in karma. However, I practice it everyday because it tricks me into being a better person!”― Clint Diffie',
        '56. “I don’t have any reason to hate anybody; I believe in good karma and spreading good energy.” – Vanilla Ice',
        '57. “I guess one of the ways that karma works is that it finds out what you are most afraid of and then makes that happen eventually.” — Cheech Marin',
        '58. “I hope karma slaps you in the face before I do.” – Unknown',
        '59. “I must have killed a lot of cows in a past life for Karma to hate me this much.”',
        '60. “I never experienced the joy of being on the good guy’s side of the perfect game or no-hitter. Karma.” — Gabe Kapler',
        '61. “I never kill insects. If I see ants or spiders in the room, I pick them up and take them outside. Karma is everything.”- Holly Valance',
        '62. “I try to be a good daughter, as I believe in karma and feel that how you are with your parents is directly proportionate to what you receive in your life. I am a big oneness follower, and our gurus have told us that if you want to achieve external happiness, you need to be happy internally. And your inner circle is your family.” — Shilpa Shetty',
        '63. “I try to live with the idea that karma is a very real thing. So I put out what I want to get back.”- Megan Fox',
        '64. “I used to steal a lot. But I don’t do that anymore, because I believe in karma.” – Andy Dick',
        '65. “I want revenge, but I don’t want to screw up my karma.” – Susan Colasanti',
        '66. “I was in the biggest breakdown of my life when I stopped crying long enough to let the words of my epiphany really sink in. That whore, karma, had finally made her way around and had just bitch-slapped me right across the face. The realization only made me cry harder.”',
        '67. “I would never disrespect any man, woman, chick or child out there. We’re all the same. What goes around comes around, and karma kicks us all in the butt in the end of the day.”- Angie Stone',
        '68. “I’m a true believer in karma. You get what you give, whether it’s bad or good.”- Sandra Bullock',
        '69. “I’m kind of crazy with karma. I really believe that everything you do revisits you, so, I’m really adamant about the kids seeing the grandparents, so like, I can see my grandkids, you know what I mean?” — Joel Madden',
        '70. “I’ve got a big heart and I believe in good karma.” – E-40',
        '71. “If a householder moulds himself according to the circumstances just like nature moulds Herself according to seasons and performs his Karma then only shall he acquire happiness.”- Rig Veda',
        '72. “If karma doesn’t catch up, God will surely pick up the slack.” – Anthony Liccione',
        '73. “If someone hates you or fights with you, know that it is your own past karma standing in front of you.” – Anandmurti Gurumaa',
        '74. “If you give a good thing to the world, then over time your karma will be good, and you’ll receive good.”- Russell Simmons',
        '75. “If you give a good thing to the world, then over time your karma will be good, and you’ll receive well.”- Russell Simmons',
        '76. “If you give the slightest pain to any living being, then in the form of pain, the pain-giving-karma will give you its ‘fruit’. So think before you hurt any living being.”― Dada Bhagwan',
        '77. “If you give your best to someone it will most definitely come back to you, often from a different person altogether.”― Hrishikesh Agnihotri',
        '78. “If you send out goodness from yourself, or if you share that which is happy or good within you, it will all come back to you multiplied ten thousand times. In the kingdom of love there is no competition; there is no possessiveness or control. The more love you give away, the more love you will have.”',
        '79. “If you’re really a mean person you’re going to come back as a fly and eat poop.”- Kurt Cobain',
        '80. “If your actions were to boomerang back on you instantly, would you still act the same?” – Alexandra Katehakis',
        '81. “In every conversation I’ve had—with housewives in Mumbai, with middle-class people, upper-class, in the slums—everyone says there is an underlying consciousness of karma. That people believe in karma—that what you’re putting out is going to come back. If I do something to you, the energy of it is going to come back to me in the future.” — Deepak Chopra',
        '82. “In the long run, every man will pay the penalty for his own misdeeds. The man who remembers this will be angry with no one, indignant with no one, revile no one, blame no one, offend no one, hate no one.”― Epictetus',
        '83. “In this world, it is not worth finding anyone’s faults. One becomes bound (by karma) by finding faults.” – Dada Bhagwan',
        '84. “Individuals create themselves through their moral choices.” – Damien Keown',
        '85. “Is Fate getting what you deserve, or deserving what you get?”',
        '86. “Is Fate getting what you deserve, or deserving what you get?” ― Jodi Picoult, Vanishing Acts',
        '87. “It is a rule of life that we eventually become victims of the evil we do to others.”― Wayne Gerard Trotman',
        '88. “It is impossible to build one’s own happiness on the unhappiness of others. This perspective is at the heart of Buddhist teachings.”',
        '89. “It is not easy to get rid of karma, and every man is subject to it. The more you push a pendulum to the right, the more it will swing to the left, then again to the right- action and reaction. No action in life goes unpaid and you can’t hide anything from yourself. You are your own witness and observer. You know what you think, feel and do and you know your real intentions. By observing yourself, you can control your karma.” – Swami Satyananda',
        '90. “It’s called karma, and it’s pronounced ha-ha-ha-ha.” — Unknown',
        '91. “Karma bides it’s time. You will always have to watch out. Karma is unforgiving and always gets payback.”- Benjamin Bayani',
        '92. “Karma brings us ever back to rebirth, binds us to the wheel of births and deaths. Good Karma drags us back as relentlessly as bad, and the chain which is wrought out of our virtues holds as firmly and as closely as that forged from our vices.” — Annie Besant',
        '93. “Karma can be seen as a curse or a gift because it keeps us attached to this world.” – Abdullah Fort',
        '94. “Karma caught up with me. It wasn’t fun but I paid my dues and got a receipt.” — Desmond Fouche',
        '95. “Karma come over. Lean on my shoulder. Tell me what’s good. I’ve been thinkin’ about ya.” — Years & Years, Karma',
        '96. “Karma comes after everyone eventually. You can’t get away with screwing people over your whole life, I don’t care who you are. What goes around comes around. That’s how it works. Sooner or later the universe will serve you the revenge that you deserve.”',
        '97. “Karma comes after everyone eventually. You can’t get away with screwing people over your whole life, I don’t care who you are. What goes around comes around. That’s how it works. Sooner or later the universe will serve you the revenge that you deserve.”- Jessica Brody',
        '98. “Karma has a surprising way of taking care of situations. All you have to do is to sit back and watch.” – Author Unknown',
        '99. “Karma has no deadline.” – Unknown',
        '100. “Karma has no heart what you do is what you get.” – Priyanshu Singh',
        '101. “Karma has no menu. You get served what you deserve.” – Unknown',
        '102. “Karma is a balance sheet of life which debits and credit all your deeds. Which is audited by our creator and actions are based on what we accumulated in it.” ― Abhysheq Shukla',
        '103. “Karma is a cruel mistress.” – Kelley York',
        '104. “Karma is a tricky thing. To serve Karma, one must repay good Karma to others. To serve Karma well, one must sometimes deliver bad Karma where it is due.” – M.R. Mathias',
        '105. “Karma is extremely efficient, if one is extremely patient.”― Efrat Cybulkiewicz',
        '106. “Karma is justice. It does not reward or punish. It shows no favoritism because we all have to earn all that we receive. Karma doesn’t predestine anything. We create our own causes and Karma adjusts the effects with perfect balance.” – Mary T. Browne',
        '107. “Karma is like a rubber band. You can only stretch it so far before it comes back and smacks you in the face.” – Unknown',
        '108. “Karma is like boomerang, bad the karma bigger the force.”― Naresh Soni',
        '109. “Karma is like gravity – it’s so basic, we don’t even notice it.” – Unknown',
        '110. “Karma is not just about the troubles, but also about surmounting them.”- Rick Springfield',
        '111. “Karma Karma, Have you ever met a girl named Karma? She’s a bitch and I’m her mothaf*ckin daughter, and I’m coming for you.” — Miss Benzo, Karma',
        '112. “Karma moves in two directions. If we act virtuously, the seed we plant will result in happiness. If we act non-virtuously, suffering results.” – Sakyong Mipham',
        '113. “Karma moves in two directions. If we act virtuously, the seed we plant will result in happiness. If we act non-virtuously, suffering results.” – Sakyong Mipham',
        '114. “Karma never loses an address.” – Unknown',
        '115. “Karma, ahhh. We sow what we reap… We reap what we sow! We reap what we sow. The law of cause and effect. And we are all under this law.”- Nina Hagen',
        '116. “Karma, karma, karma, karma, karma chameleon. You come and go, you come and go. Loving would be easy if your colors were like my dreams: red, gold, and green, red, gold, and green.” — Culture Club, Karma Chameleon',
        '117. “Karma, memory, and desire are just the software of the soul. It’s conditioning that the soul undergoes in order to create experience. And it’s a cycle. In most people, the cycle is a conditioned response. They do the same things over and over again.” — Deepak Chopra',
        '118. “Karma, simply put, is an action for an action, good or bad.”- Stephen Richards',
        '119. “Karma’s just sharpening her fingernails and finishing her drink. She says she’ll be with you shortly.” — Unknown',
        '120. “Karma’s just sharpening her nails and finishing her drink. She says she’ll be with you shortly.” – Unknown',
        '121. “Life is a boomerang. What you give you get.” – Unknown',
        '122. “Life is painful. It has thorns, like the stem of a rose. Culture and art are the roses that bloom on the stem. The flower is yourself, your humanity. Art is the liberation of the humanity inside yourself.”',
        '123. “Like gravity, karma is so basic we often don’t even notice it.”- Sakyong Mipham',
        '124. “Live a good and honorable life. Then, when you are older you can look back and enjoy it a second time.” – Dalai Lama',
        '125. “Many believe in karma but I take it to a whole different level.” – Vincent Alexandria',
        '126. “Mark my words; someday she’ll get what’s coming to her. Karma’s a bigger bitch than she is.” — Kathleen Brooks',
        '127. “Maybe Karma wouldn’t be so nasty if we stopped calling her a bitch.” — Unknown',
        '128. “Men are not punished for their sins, but by them.”- Elbert Hubbard',
        '129. “My actions are my only true belongings. I cannot escape the consequences of my actions. My actions are the ground upon which I stand.”- Thích Nhất Hạnh',
        '130. “Never underestimate the power of a kind word or deed.” – Unknown',
        '131. “No matter what kind of karma you gathered in the past, this moment’s karma is always in your hands.” – Sadhguru',
        '132. “No need to place an order in karma cafe. You Are Automatically served what you deserve.” – Unknown',
        '133. “No one can escape karma. Two events which may, at first, seem disconnected can be karmically connected. After all, karma works on a spiritual level which may manifest itself physically in a myriad of seemingly unrelated ways.”― Charbel Tadros',
        '134. “Nobody in this world is free of karma. Even if God comes to this planet He will be confined to the karmas of life, the karmas of the body, the karmas of the mind, the karmas of the spirit.” – Swami Niranjana',
        '135. “Not only is there often a right and wrong but what goes around does come around, Karma exists.” – Donald Van De Mark',
        '136. “Nothing happens by chance, by fate. You create your own fate by your actions. That’s Karma.”',
        '137. “O please understand, karmas can be cut off, chopped off, and elimina­ted. One can free one from karma by living a life of Dharma.” – Guru Gobindh Singh',
        '138. “Often when someone hurts you, they aren’t hurting you because you are you. They hurting you because they are them.” – Karen Salmansohn',
        '139. “Once you know the nature of anger and joy is empty and you let them go, you free yourself from karma.” – Gautama Buddha',
        '140. “Parents are one’s companions in life but not partakers of one’s karma.” — Munshi Premchand',
        '141. “People are entangled in the enjoyment of fine clothes, but gold and silver are only dust. They acquire beautiful horses and elephants, and ornate carriages of many kinds. They think of nothing else, and they forget all their relatives. They ignore their Creator; without the Name, they are impure.” – Sri Guru Granth Sahib',
        '142. “People pay for what they do, and still more, for what they have allowed themselves to become. And they pay for it simply: by the lives they lead.”- Edith Wharton',
        '143. “People pay for what they do, and, still more, for what they have allowed themselves to become. And they pay for it simply: by the lives they lead.” — James Baldwin',
        '144. “People who create their own drama deserve their own karma.” – Unknown',
        '145. “Problems or successes, they all are the results of our own actions. Karma. The philosophy of action is that no one else is the giver of peace or happiness. One’s own karma, one’s own actions are responsible to come to bring either happiness or success or whatever.” — Maharishi Mahesh Yogi',
        '146. “Realize that everything connects to everything else.”- Leonardo Da Vinci',
        '147. “Release the pain of the past and allow karma to kick your offender’s booty.” – Karen Salmansohn',
        '148. “Remember the unkindness, dishonesty, and deception you display toward others…dont be shocked when it comes back to bite you.” – Sarah Moore',
        '149. “Remember to honor the hand which reached out for you when you needed it, by being that hand to someone else who is struggling.”― Greg Dutilly',
        '150. “Revenge will never solve anything, karma will.” – Author Unknown',
        '151. “Show a little faith in someone when they need it. It’s amazing how it comes back around to you.”― Garon Whited',
        '152. “So never rule out retribution. But never expect it.” – Vera Nazarian',
        '153. “So where’s the karma doc, I’ve lost my patience. Cause I’ve been so good, I’ve been working my ass off. I’ve been so good, still, I’m lonely and stressed out.” — AJR, Karma',
        '154. “Some day people will ask me what is the key to my success…and I will simply say, “Good Karma.” – K. Crumley',
        '155. “Some good Karma I must have done that I went from marriage from Hell to finding my real soul mate.” — Raj Kundra',
        '156. “Something to remember: Karma is only a bitch—if you are.” — Unknown',
        '157. “Sometimes you get what’s coming around. And sometimes, you are what’s coming around.”― Jim Butcher',
        '158. “Sooner or later in life, we will all take our own turn being in the position we once had someone else in.”',
        '159. “Sooner or later, everyone sits down to a banquet of consequences.” — Robert Louis Stevenson',
        '160. “Still others commit all sorts of evil deeds, claiming karma doesn’t exist. They erroneously maintain that since everything is empty, committing evil isn’t wrong. Such persons fall into a hell of endless darkness with no hope of release. Those who are wise hold no such conception.”- Bohidharma',
        '161. “Stop blaming others for the pains and sufferings you have. They are because of you, your karma, and your own disposition.”― Girdhar Joshi',
        '162. “That whore, karma, has finally made her way around, and had just bitch-slapped me right across the face.” — Jennifer Salaiz',
        '163. “The conscious process is reflected in the imagination; the unconscious process is expressed as karma, the generation of actions divorced from thinking and alienated from feeling.” — William Irwin Thompson',
        '164. “The Law of Karma is also called the Law of Cause and Effect, Action and Reaction and: as you sow, so shall you reap.” – Sham Hinduja',
        '165. “The life I touch for good or ill will touch another life, and that in turn another, until who knows where the trembling stops or in what far place my touch will be felt.”- Frederick Buechner',
        '166. “The love you send into the world, you will find, is the love that returns to you.”― Avina Celeste',
        '167. “The man who does ill must suffer ill.” – Aeschylus',
        '168. “The man who works for others, without any selfish motive, really does good to himself” – Ramakrishna Paramahansa',
        '169. “The meaning of karma is in the intention. The intention behind action is what matters” – The Gita',
        '170. “The person who’s mind is always free from attachment, who has subdued the mind and senses, and who is free from desires, attains the supreme perfection of freedom from Karma through renunciation.” – The Gita',
        '171. “The samskaras of impressions of these good actions are indelibly embedded in your subconscious mind. The force of these samskaras will again propel you to do some more good actions.” – Swami Sivananda',
        '172. “The subject of karma and destiny is a very difficult one to talk about and understand because to experience karma and destiny is a lifelong process beyond human comprehension.” – Swami Niranjana',
        '173. “The thing you know as Karma, does not really exist the way you think. It can only exist through the law of causality, which means, when you make efforts to achieve something, the results do indeed occur, given enough time, resources and above all, perseverance.”― Abhijit Naskar',
        '174. “The tired wisdom of knowing that what goes around eventually comes around.” – Arundhati Roy',
        '175. “The universal law of karma.. is that of action and reaction, cause and effect, sowing and reaping. In the course of natural righteousness, man, by his thoughts and actions, becomes the arbiter of his destiny.” – Paramahansa Yogananda',
        '176. “The universe does not carry debts, it always',
        '177. “There are the waves and there is the wind, seen and unseen forces. Everyone has these same elements in their lives, the seen and unseen, karma and free will.”- Kuna Yin',
        '178. “There are the waves, and there is the wind, seen and unseen forces. Everyone has these same elements in their lives, the seen and unseen, karma and free will.” — Kuan Yin',
        '179. “There is a wonderful mythical law of nature that the three things we crave most in life — happiness, freedom, and peace of mind — are always attained by giving them to someone else.”- Peyton Conway March',
        '180. “There’s a natural law of karma that vindictive people, who go out of their way to hurt others, will end up broke and alone.”- Sylvester Stallone',
        '181. “Things don’t just happen in this world of arising and passing away. We don’t live in some kind of crazy, accidental universe. Things happen according to certain laws, laws of nature. Laws such as the law of karma, which teaches us that as a certain seed gets planted, so will that fruit be.” – Sharon Salzberg',
        '182. “This is your karma. You do not understand now, but you will understand later.” – H. Raven Rose',
        '183. “Those who are free of resentful thoughts surely find peace.” – Gautama Buddha',
        '184. “Thoughts lead on to purposes; purposes go forth in action; actions form habits; habits decide character; and character fixes our destiny.”- Tryon Edwards',
        '185. “Treat other people’s homes as you want them to respect yours because what goes around comes around.” – Ana Monnar',
        '186. “Truth burns up all karma and frees you from all births.” – Paramahansa Yogananda',
        '187. “Universe first gives you; what you wished for others.”― Aditya Ajmera',
        '188. “We create karma by all kinds of selfish actions. The first thing we must understand is that we are psychologically asleep. It is very difficult for us to be conscious of ourselves. We are not very aware. We must come to recognize that we do not pay attention.” ― Abhysheq Shukla',
        '189. “We don’t find love, love finds us. What you put out into the universe will find its way back to you.” ― Raneem Kayyali',
        '190. “We interact in these five dimensions simultaneously. The process of interaction happens through the aspect of karma. What is karma? The literal meaning of karma is action, and it has been used in many different ways to define the levels of human interaction, to define the nature which is manifesting in one’s life.” – Swami Niranjana',
        '191. “We must always reflect only what we wish to see reflected within us.”― Robin Sacredfire',
        '192. “What goes around comes around Karma. You get back what you put out Karma. She a bad bitch without a doubt.” — Highkeem, Karma',
        '193. “What goes around comes around. And sometimes you get what’s coming around.” – Jim Butcher',
        '194. “What goes around, comes around like a hula hoop. Karma is a bitch? Well, just make sure that bitch is beautiful.” — Lil Wayne',
        '195. “Whatever we do lays a seed in our deepest consciousness, and one day that seed will grow.”- Sakyong Mipham',
        '196. “Whatever you give to life, it gives you back. Do not hate anybody. The hatred which comes out from you will someday come back to you. Love others. And love will come back to you.”- Author Unknown',
        '197. “When karma comes back to punch you in the face, I want to be there. Just in case it needs help.”',
        '198. “When karma finally hits you in the face, I will be there, just in case it needs some help.” — Unknown',
        '199. “When karma lands, it lands hard.” — Tom Fitton',
        '200. “When someone has a strong intuitive connection, Buddhism suggests that it’s because of karma, some past connection.” – Richard Gere',
        '201. “When you carry out acts of kindness you get a wonderful feeling inside. It is as though something inside your body responds and says, yes, this is how I ought to feel.”- Harold Kushner',
        '202. “When you do something bad: it comes back to you later.”',
        '203. “When you plant a seed of love, it is you that blossoms.” – Ma Jaya Sati Bhagavati',
        '204. “When you see a good person, think of becoming like her/him. When you see someone not so good, reflect on your own weak points.”',
        '205. “When you see a good person, think of becoming like her/him. When you see someone not so good, reflect on your own weak points.” ― Confucius',
        '206. “When you truly understand karma, then you realize you are responsible for everything in your life.” – Keanu Reeves',
        '207. “Worthless people blame their karma.”- Burmese Proverb',
        '208. “You are free to choose, but you are not free from the consequence of your choice.”- Author Unknown',
        '209. “You are the architect of your own fate. You are the master of your own destiny. You can do and undo things. You sow an action and reap a tendency. You sow a tendency and reap a habit. You sow a habit and reap your character. You sow your character and reap your destiny. Therefore, destiny is your own creation. You can undo it if you like – destiny is a bundle of habits.” – Swami Sivananda',
        '210. “You can’t get there alone. People have to help you, and I do believe in karma. I believe in paybacks. You get people to help you by telling the truth, by being earnest.” — Randy Pausch',
        '211. “You cannot control the results, only your actions.” – Allan Lokos',
        '212. “You cannot do a kindness too soon, for you never know how soon it will be too late.”- Ralph Waldo Emerson',
        '213. “You cannot do harm to someone because someone has done harm to you. You will pay just like they will.”- Ericka Williams',
        '214. “You have to be very careful when involving yourself with someone else’s karma.” – Brownell Landrum',
        '215. “You might have burned me with your lies, but karma is about to set you on fire.” — Unknown',
        '216. “You must acknowledge and experience this part of the universe. Karma is intricate, too vast. You would, with your limited human senses, consider it too unfair. But you have tools to really, truly love. Loving the children is very important. But love everyone as you would love your children.” – Kuan Yin',
        '217. “You win some, you lose some, let Karma take its course.” – Cocoy McCoy',
        '218. “Your believing or not believing in karma has no effect on its existence, nor on its consequences to you. Just as a refusal to believe in the ocean would not prevent you from drowning.” — F. Paul Wilson',
        '219. "Karma grows from our hearts. Karma terminates from our hearts." – Gautama Buddha',
    ];
    // Return a random quote
    return quotes[Math.floor(Math.random() * quotes.length)];
}