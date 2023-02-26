import {
  Colors,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  // ColorResolvable,
  MessageComponentInteraction,
  time,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  ModalSubmitInteraction,
  StringSelectMenuComponent,
  // StringSelectMenuInteraction,
  InteractionEditReplyOptions,
  InteractionUpdateOptions,
  SelectMenuComponentOptionData,
  AttachmentBuilder,
  GuildMember,
  TextChannel,
  Message,
  ComponentType,
  ColorResolvable,
} from 'discord.js';
import {
  APIEmbed,
  APISelectMenuOption,
  ButtonStyle, TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { getPersonaInfo, setPersonaInfo } from '../../../global/commands/g.rpg';
import { startLog } from '../../utils/startLog';
import {
  getUser, inventoryGet, inventorySet, personaSet,
} from '../../../global/utils/knex';
import { Personas, RpgInventory } from '../../../global/@types/database';
import { imageGet } from '../../utils/imageGet';
const Trivia = require('trivia-api')
const trivia = new Trivia({ encoding: 'url3986' });
const F = f(__filename);

export async function getQuestions(amount: number, type: string) {
  const { results } = await trivia({ amount, type });
    return results;
}

export const dTrivia: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Play a short trivia game with the bot')
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
        { name: 'Easy', value: 'easy' },
        { name: 'Medium (50% bonus tokens)', value: 'medium' },
        { name: 'Hard (100% bonus tokens)', value: 'hard' },
      )
      .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const numberofQuestions = interaction.options.getString('amount') || '5';
    const chosenDifficulty = interaction.options.getString('difficulty') || 'easy';
    const bonus = chosenDifficulty === 'easy' ? 1 : chosenDifficulty === 'medium' ? 1.5 : 2;
    let score = 0;
    let timedOut = false;
    let answerColor = Colors.Purple as ColorResolvable;
    let embedStatus = 'Welcome to Trivia!';
    let questionAnswer = 'You have 30 seconds to answer each question.';
    const choices = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < 5; i++) {
      const { results } = await trivia.getQuestions({
        amount: numberofQuestions,
        type: 'multiple', // Only multiple choice questions
        difficulty: chosenDifficulty,
      });

      const question = results[0]; // Get the first question from the array
      const answers = [...question.incorrect_answers, question.correct_answer]; // Combine the correct and incorrect answers
      answers.sort(() => Math.random() - 0.5); // Shuffle the answers (So the correct answer isn't always the last one)
      const answerMap = new Map(answers.map((answer, index) => [choices[index], `${answer}`]));  // Map the answers to the choices (A, B, C, D)

      const embed = new EmbedBuilder()
        .setColor(answerColor as ColorResolvable)
        .setTitle(embedStatus)
        .setDescription(questionAnswer)
        .addFields({ name: `Question ${i + 1}`, value: question.question })
        .addFields({ name: 'Choices', value: [...answerMap.values()].join('\n') })
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })

      if (i === 0) {
        await interaction.reply({  // If it's the first question, send a new message
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              choices.map((choice) =>
                new ButtonBuilder()
                  .setCustomId(choice)
                  .setLabel(choice)
                  .setStyle(ButtonStyle.Success)
              )
            ),
          ],
        });
      } else {
        await interaction.editReply({ // If not the first question, edit the previous message
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              choices.map((choice) =>
                new ButtonBuilder()
                  .setCustomId(choice)
                  .setLabel(choice)
                  .setStyle(ButtonStyle.Success)
              )
            ),
          ],
        });
      }

      const filter = (interaction: MessageComponentInteraction) => { // Filter for the buttons
        return interaction.user.id === interaction.user.id && answerMap.has(interaction.customId);
      };      

      try { // Wait for the user to answer
        const collected = await interaction.channel!.awaitMessageComponent({
          filter,
          time: 30000,
          componentType: ComponentType.Button,
        });

        const answer = answerMap.get(collected.customId); // Get the answer from the map
        log.debug(F, `User chose: ${answer}`);
        log.debug(F, `Correct answer was: ${question.correct_answer}`);

        if (answer === question.correct_answer) {  // If the user answers correctly
          embedStatus = 'Correct!';
          answerColor = Colors.Green as ColorResolvable,
          questionAnswer = `The answer was ${question.correct_answer}`;
          score++;
          await collected.update({
          });
        } else { // If the user answers incorrectly
          embedStatus = 'Incorrect!';
          answerColor = Colors.Red as ColorResolvable,
          questionAnswer = `The correct answer was ${question.correct_answer}`;
          await collected.update({
          });
        }

      } catch (error) { // If the user doesn't answer in time
        timedOut = true;
      }

      results.splice(0, 1); // Remove the first question from the array
      if (timedOut) break;
    }

    if (!timedOut) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setColor(answerColor as ColorResolvable)
        .setTitle(embedStatus)
        .setDescription(questionAnswer)
        .addFields({ name: `That's all the questions!` , value: `You got ${score} out of 5 questions correct, and earned ${(Math.ceil(score * bonus))} tokens!`})
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      await interaction.editReply({
        embeds: [embed],
        components: [],
      })
      
    } else {
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle('Time\'s up!')
        .setDescription(`You got ${score} out of 5 questions correct, and earned ${(Math.ceil(score * bonus))} tokens!`)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      await interaction.editReply({
        embeds: [embed],
        components: [],
      })
    }
    return true;

  },
};
