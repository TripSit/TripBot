import {
  Colors,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  MessageComponentInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  ComponentType,
  ColorResolvable,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import he from 'he';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { getPersonaInfo, setPersonaInfo } from '../../../global/commands/g.rpg';
import { startLog } from '../../utils/startLog';
import {
  getUser,
} from '../../../global/utils/knex';
import { Personas } from '../../../global/@types/database';

const Trivia = require('trivia-api');

const trivia = new Trivia({ encoding: 'url3986' });
const F = f(__filename);

const optionDict = {
  easy: {
    name: 'Normal',
    bonus: 1,
  },
  medium: {
    name: 'Hard',
    bonus: 1.5,
  },
  hard: {
    name: 'Very Hard',
    bonus: 2,
  },
};

const bonusMessageDict = {
  easy: '',
  medium: ' *(+50% difficulty bonus)*',
  hard: ' *(+100% difficulty bonus)*',
};


const timeOutMessageList = [ // Random messages to display when the user runs out of time
  'Be faster next time!',
  'Be a bit quicker next time!',
  'You were far too slow!',
  'If you were any slower, you would have been going backwards!',
  'You were almost as slow as a snail!',
  'You were slower than a turtle!',
  'A sloth could have answered that faster!',
]

const awfulScoreMessageList = [ // Random messages to display when the user got no questions right
  'Yikes...',
  'Ouch...',
  'That was awful...',
  'That was terrible...',
  'That was horrible...',
  'Were you even trying?',
  'I\'ll pretend I didn\'t see that...',
  'Let\'s just forget that ever happened...',
  '...',
  'I\'m speechless...',
]

const badScoreMessageList = [ // Random messages to display when the user got less than half the questions right
  'Is that all you got?',
  'You can do better than that!',
  'Is that the best you can do?',
  'Better than nothing, I guess...',
  'You wouldn\'t want to vs my grandma...',
  'Come on, you can do better than that!',

]

const goodScoreMessageList = [ // Random messages to display when the user got more than half the questions right
  'Not bad!',
  'Not too shabby!',
  'Getting close!',
  'Almost there!',
  'You\'re getting there!',
  'Now we\'re talking!',
  'Let\'s see if you can keep it up!',
  'Let\'s go for gold next time!',
  'You\'re a natural!',
]

const perfectScoreMessageList = [ // Random messages to display when the user got all the questions right
  'Now that\'s what I call a fine score!',
  'You\'re a genius!',
  'You\'re a trivia master!',
  'You\'re a trivia god!',
  'Have you ever considered being a professional trivia player?',
  'That last player could learn a thing or two from you!',
  'Very impressive!',
  'You\'re on a roll!',
]


type TriviaQuestion = {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  all_answers: string[];
};

export async function getQuestions(
  amount: number,
  difficulty:string,
):Promise<TriviaQuestion[]> {
  log.debug(F, `Getting question with difficulty: ${difficulty}...`);

  const { results } = await trivia.getQuestions({ amount, type: 'multiple', difficulty });

  log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  return results.map((questionData:{
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }) => {
    const answers = [...questionData.incorrect_answers, questionData.correct_answer];
    // Unescape HTML entities
    const fixedQuestion = he.unescape(questionData.question);
    // const fixedCorrectAnswer = he.unescape(question.correct_answer);
    // const fixedIncorrectAnswers = he.unescape(...question.incorrect_answers);
    const fixedAnswers = [...questionData.incorrect_answers, questionData.correct_answer];
    // const fixedAnswers = he.unescape(answers)
    log.debug(F, `Broken Question: ${questionData.question}, Fixed Question: ${fixedQuestion}`);
    log.debug(F, `Broken Answer: ${answers}, Fixed Answer: ${fixedAnswers}`);
    // Shuffle the answers (So the correct answer isn't always the last one)
    fixedAnswers.sort(() => Math.random() - 0.5);

    return {
      category: questionData.category,
      type: questionData.type,
      difficulty: questionData.difficulty,
      question: fixedQuestion,
      correct_answer: questionData.correct_answer,
      all_answers: fixedAnswers,
    } as TriviaQuestion;
  });
}

export const dTrivia: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Play a game of trivia to earn tokens!')
    .addStringOption(option => option.setName('amount')
      .setDescription('The amount of questions to answer')
      .addChoices(
        { name: '5', value: '5' },
        { name: '10', value: '10' },
        { name: '15', value: '15' },
        { name: '20', value: '20' },
      )
      .setRequired(false))
    .addStringOption(option => option.setName('difficulty')
      .setDescription('The difficulty of the questions')
      .addChoices(
        { name: 'Normal', value: 'easy' },
        { name: 'Hard (50% bonus tokens)', value: 'medium' },
        { name: 'Very Hard (100% bonus tokens)', value: 'hard' },
      )
      .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    startLog(F, interaction);

    const amountOfQuestions = parseInt(interaction.options.getString('amount') || '5', 10);
    const chosenDifficulty = interaction.options.getString('difficulty') || 'easy';
    const difficultyName = optionDict[chosenDifficulty as keyof typeof optionDict].name;
    const { bonus } = optionDict[chosenDifficulty as keyof typeof optionDict];
    let bonusMessage = bonusMessageDict[chosenDifficulty as keyof typeof bonusMessageDict];
    let score = 0;
    let scoreMessage = '';
    let timedOut = false;
    let answerColor = Colors.Purple as ColorResolvable;
    let embedStatus = `Starting trivia with ${amountOfQuestions} questions!`;
    let questionAnswer = 'You have 30 seconds to answer each question.';
    const choices = ['<:buttonBoxA:1079741192398438451>', '<:buttonBoxB:1079748167043653632>', '<:buttonBoxC:1079748173700005929>', '<:buttonBoxD:1079748179794350100>'];
    const choiceEmoji = (choice: String) => { // emoji for the buttons without the emoji name
      switch (choice) {
        case '<:buttonBoxA:1079741192398438451>':
          return '1079741192398438451';
        case '<:buttonBoxB:1079748167043653632>':
          return '1079748167043653632';
        case '<:buttonBoxC:1079748173700005929>':
          return '1079748173700005929';
        case '<:buttonBoxD:1079748179794350100>':
          return '1079748179794350100';
        default:
          return '❓';
      }
    };

    // Get the user's persona data
    let [personaData] = await getPersonaInfo(interaction.user.id);
    // log.debug(F, `Initial Persona data: ${JSON.stringify(personaData, null, 2)}`);

    // If the user doesn't have persona data, create it
    if (!personaData) {
      const userData = await getUser(interaction.user.id, null);
      personaData = {
        user_id: userData.id,
        tokens: 0,
      } as Personas;

      // log.debug(F, `Setting Persona data: ${JSON.stringify(personaData, null, 2)}`);

      await setPersonaInfo(personaData);
    }
    const questionList = await getQuestions(amountOfQuestions, chosenDifficulty);

    let qNumber = 0;
    for (qNumber = 0; (qNumber < amountOfQuestions); qNumber += 1) {
      // Get the first question from the array
      const [questionData] = questionList;

      const answerMap = new Map(questionData.all_answers.map((answer, index) => [choices[index], `**${choices[index]}** ${answer}`])); // eslint-disable-line max-len
      const embed = new EmbedBuilder()
        .setColor(answerColor)
        .setTitle(`<:buttonTrivia:1079707985133191168> Trivia *(${difficultyName})*`)
        .addFields({ name: `Question ${qNumber + 1} of ${amountOfQuestions}`, value: questionData.question })
        .addFields({ name: 'Choices', value: [...answerMap.values()].join('\n') })
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
        
      if (qNumber === 0) {
        await interaction.reply({ embeds: [embedTemplate().setTitle('Loading...')] }); // eslint-disable-line no-await-in-loop, max-len
        const startingEmbed = new EmbedBuilder()
        .setColor(answerColor)
        .setTitle(`<:buttonTrivia:1079707985133191168> Trivia *(${difficultyName})*`)
        .addFields({ name: `Starting Trivia with ${amountOfQuestions} questions...`, value: ` ` })
        .addFields({ name: `Get ready!`, value: `You have 30 seconds to answer each question.` })
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
        await interaction.editReply({ embeds: [startingEmbed] }); // eslint-disable-line no-await-in-loop, max-len
        // If it's the first question, send a new message
        setTimeout(async function() { // Wait 5 seconds before sending the first question
        await interaction.editReply({ // eslint-disable-line no-await-in-loop
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              choices.map(choice => new ButtonBuilder()
                .setDisabled(false)
                .setCustomId(choice)
                .setEmoji(choiceEmoji(choice))
                .setStyle(ButtonStyle.Secondary)),
            ),
          ],
        });
        }, 5000);

      } else {
        // If not the first question, edit the previous message
        setTimeout(async function() { // Wait 5 seconds before sending the next question
          await interaction.editReply({ // eslint-disable-line no-await-in-loop
            embeds: [embed],
            components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              choices.map(choice => new ButtonBuilder()
                .setDisabled(false)
                .setCustomId(choice)
                .setEmoji(choiceEmoji(choice))
                .setStyle(ButtonStyle.Secondary)),
            ),
          ],
          });
        }, 5000);
      }

      // Filter for the buttons
      const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id && answerMap.has(i.customId);
      try {
        if (!interaction.channel) throw new Error('Channel not found');
        const collected = await interaction.channel.awaitMessageComponent({ // eslint-disable-line no-await-in-loop
          filter,
          time: 30000,
          componentType: ComponentType.Button,
        });

        if (collected) {
          // Disable all buttons
          const disabledButtons = choices.map((choice) =>
            new ButtonBuilder()
              .setCustomId(choice)
              .setDisabled(true)
              .setEmoji(choiceEmoji(choice))
              .setStyle(ButtonStyle.Secondary)
          );
      
          await collected.update({
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(disabledButtons)],
          });
        }

        let answer = answerMap.get(collected.customId); // Get the answer from the map
        answer = answer?.substring(38);
        log.debug(F, `User chose: ${answer}`);
        log.debug(F, `Correct answer was: ${questionData.correct_answer}`);

        if (answer === questionData.correct_answer) { // If the user answers correctly
          score += 1;
          const embed = new EmbedBuilder()
          .setColor(Colors.Green as ColorResolvable)
          .setTitle(`<:buttonTrivia:1079707985133191168> Trivia *(${difficultyName})*`)
          .addFields({ name: `Correct!`, value: `The answer was **${questionData.correct_answer}.**` })
          .addFields({ name: `Current Score`, value: `${score} of ${(qNumber + 1)}`})
          .addFields({ name: 'Next question in 5 seconds...', value: ' '})
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
          embedStatus = 'Correct!';
          questionAnswer = `The answer was **${questionData.correct_answer}.**`;
          await interaction.editReply({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                choices.map(choice => new ButtonBuilder()
                  .setDisabled(true)
                  .setCustomId(choice)
                  .setEmoji(choiceEmoji(choice))
                  .setStyle(ButtonStyle.Secondary)),
              ),
            ],
          });
        } else { // If the user answers incorrectly
          const embed = new EmbedBuilder()
          .setColor(Colors.Grey as ColorResolvable)
          .setTitle(`<:buttonTrivia:1079707985133191168> Trivia *(${difficultyName})*`)
          .addFields({ name: `Incorrect!`, value: `The correct answer was **${questionData.correct_answer}.**` })
          .addFields({ name: `Current Score:`, value: `${score} of ${(qNumber + 1)}`})
          .addFields({ name: 'Next question in 5 seconds...', value: ' '})
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
          embedStatus = 'Incorrect!';
          questionAnswer = `The correct answer was **${questionData.correct_answer}.**`;
          await interaction.editReply({ // eslint-disable-line no-await-in-loop
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                choices.map(choice => new ButtonBuilder()
                  .setDisabled(true)
                  .setCustomId(choice)
                  .setEmoji(choiceEmoji(choice))
                  .setStyle(ButtonStyle.Secondary)),
              ),
            ],
          });
        }
      } catch (error) { // If the user doesn't answer in time
        embedStatus = 'Time\'s up!';
        answerColor = Colors.Red as ColorResolvable;
        questionAnswer = `The correct answer was **${questionData.correct_answer}.**`;
        timedOut = true;
      }

      questionList.splice(0, 1); // Remove the first question from the array
      if (timedOut) break;
    }
    let payout = 0;
    let perfectBonus = '';
    if (score !== 0) { // The user got at least one question correct
      if (score === amountOfQuestions) { // Bonus for getting all questions correct
        payout = ((score * bonus) + (score * 1.5));
        perfectBonus = ' ***(+50% perfect score bonus)***'
      } else {
        payout = (score * bonus);
      }
      log.debug(F, `Payout: ${payout} tokens`);
      Math.round(payout);
      log.debug(F, `Rounded Payout: ${payout} tokens`);
      personaData.tokens += payout;
      log.debug(F, `User scored: ${score}`);
      log.debug(F, `User earned: ${payout} tokens`);
      await setPersonaInfo(personaData);
    } else {
      bonusMessage = '';
    }
     

    if (!timedOut) {
      if (score === 0) {
        scoreMessage = awfulScoreMessageList[Math.floor(Math.random() * awfulScoreMessageList.length)];
      }
      if (score <= (amountOfQuestions / 2)) {
        scoreMessage = badScoreMessageList[Math.floor(Math.random() * badScoreMessageList.length)];
      }
      if (score > (amountOfQuestions / 2)) {
        scoreMessage = goodScoreMessageList[Math.floor(Math.random() * goodScoreMessageList.length)];
      }
      if (score === amountOfQuestions) {
        scoreMessage = perfectScoreMessageList[Math.floor(Math.random() * perfectScoreMessageList.length)];
      }
      log.debug(F, `Score Message: ${scoreMessage}`);
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle(`<:buttonTrivia:1079707985133191168> Trivia *(${difficultyName})*`)
        .addFields({ name: `${embedStatus}`, value: `${questionAnswer}` })
        .addFields({ name: `You got ${score} out of ${amountOfQuestions} questions correct.${perfectBonus}`, value: `${scoreMessage}`})
        .addFields({ name: `You earned ${payout} tokens!${bonusMessage}`, value: `You now have ${(personaData.tokens + payout)} tokens.` }) // eslint-disable-line max-len
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    } else {
      const timeOutMessage = timeOutMessageList[Math.floor(Math.random() * timeOutMessageList.length)];
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle(`<:buttonTrivia:1079707985133191168> Trivia *(${difficultyName})*`)
        .addFields({ name: `${embedStatus}`, value: `${questionAnswer}` })
        .addFields({ name: `${timeOutMessage}`, value: `You got ${score} out of ${amountOfQuestions} questions correct.${perfectBonus}`})
        .addFields({ name: `You earned ${payout} tokens!${bonusMessage}`, value: `You now have ${(personaData.tokens + payout)} tokens.` }) // eslint-disable-line max-len
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
      await interaction.editReply({
        embeds: [embed],
        components: [],
      })
    }
    return true;
  },
};
