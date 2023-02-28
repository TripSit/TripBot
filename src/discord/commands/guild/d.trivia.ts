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
    let score = 0;
    let timedOut = false;
    let answerColor = Colors.Purple as ColorResolvable;
    let embedStatus = `Starting trivia with ${amountOfQuestions} questions!`;
    let questionAnswer = 'You have 30 seconds to answer each question.';
    const choices = ['A', 'B', 'C', 'D'];

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

    for (let qNumber = 0; (qNumber < amountOfQuestions); qNumber += 1) {
      // Get the first question from the array
      const [questionData] = questionList;

      const answerMap = new Map(questionData.all_answers.map((answer, index) => [choices[index], `**${choices[index]}:** ${answer}`])); // eslint-disable-line max-len
      const embed = new EmbedBuilder()
        .setColor(answerColor)
        .setTitle(`${env.EMOJI_TRIVIA} Trivia (${difficultyName})`)
        .addFields({ name: `${embedStatus}`, value: `${questionAnswer}` })
        .addFields({ name: `Question ${qNumber + 1} of ${amountOfQuestions}`, value: questionData.question })
        .addFields({ name: 'Choices', value: [...answerMap.values()].join('\n') })
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len

      if (qNumber === 0) {
        await interaction.reply({ embeds: [embedTemplate().setTitle('Loading...')] }); // eslint-disable-line no-await-in-loop, max-len
        // If it's the first question, send a new message
        await interaction.editReply({ // eslint-disable-line no-await-in-loop
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              choices.map(choice => new ButtonBuilder()
                .setCustomId(choice)
                .setLabel(choice)
                .setStyle(ButtonStyle.Success)),
            ),
          ],
        });
      } else {
        // If not the first question, edit the previous message
        await interaction.editReply({ // eslint-disable-line no-await-in-loop
          embeds: [embed],
        });
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

        let answer = answerMap.get(collected.customId); // Get the answer from the map
        answer = answer?.substring(7);
        log.debug(F, `User chose: ${answer}`);
        log.debug(F, `Correct answer was: ${questionData.correct_answer}`);

        if (answer === questionData.correct_answer) { // If the user answers correctly
          embedStatus = 'Correct!';
          answerColor = Colors.Green as ColorResolvable;
          questionAnswer = `The answer was **${questionData.correct_answer}**`;
          score += 1;
          await collected.update({}); // eslint-disable-line no-await-in-loop
        } else { // If the user answers incorrectly
          embedStatus = 'Incorrect!';
          answerColor = Colors.Grey as ColorResolvable;
          questionAnswer = `The correct answer was **${questionData.correct_answer}.**`;
          await collected.update({}); // eslint-disable-line no-await-in-loop
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
    if (score !== 0) { // The user won
      payout = (score * bonus);
      personaData.tokens += payout;
      log.debug(F, `User scored: ${score}`);
      log.debug(F, `User earned: ${payout} tokens`);
      await setPersonaInfo(personaData);
    }

    if (!timedOut) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle(`<:buttonTrivia:1079707985133191168> Trivia (${difficultyName})`)
        .addFields({ name: `${embedStatus}`, value: `${questionAnswer}` })
        .addFields({ name: 'That\'s all the questions!', value: ' ' })
        .addFields({ name: `You got ${score} out of ${amountOfQuestions} questions correct, and earned ${payout} tokens!`, value: `You now have ${(personaData.tokens + payout)} tokens.` }) // eslint-disable-line max-len
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    } else {
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle(`<:buttonTrivia:1079707985133191168> Trivia (${difficultyName})`)
        .addFields({ name: `${embedStatus}`, value: `${questionAnswer}` })
        .addFields({ name: 'Be faster next time!', value: ' ' })
        .addFields({ name: `You got ${score} out of ${amountOfQuestions} questions correct, and earned ${payout} tokens!`, value: `You now have ${(personaData.tokens + payout)} tokens.` }) // eslint-disable-line max-len
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    }
    return true;
  },
};
