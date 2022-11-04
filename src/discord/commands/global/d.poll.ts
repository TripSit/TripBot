import {
  SlashCommandBuilder,
  GuildMember,
  TextChannel,
  Message,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import log from '../../../global/utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const emojiDict = {
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  9: '9️⃣',
};

export const dpoll: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Creates a poll!')
    .addStringOption((option) => option
      .setName('question')
      .setDescription('What do you want to ask?')
      .setRequired(true))
    .addStringOption((option) => option
      .setName('options')
      .setDescription('CSV of options, EG: "Red, Blue, Green"')
      .setRequired(true)),
  async execute(interaction) {
    log.debug(`[${PREFIX}] Starting!`);
    await interaction.deferReply({ephemeral: true});
    const question = interaction.options.getString('question');
    const optionsString = interaction.options.getString('options');
    if (!question || !optionsString) {
      await interaction.editReply('You need to provide a question and options!');
      return false;
    }
    const optionsArray = optionsString.split(',');

    if (optionsArray.length > 9) {
      await interaction.editReply('You can only have 9 options max!');
      return false;
    }

    let body = '';
    for (let i = 0; i < optionsArray.length; i += 1) {
      body += `\n${i + 1}. ${optionsArray[i].trim()}`;
    }

    const pollEmbed = embedTemplate()
      .setAuthor(null)
      .setTitle(`**${question}**`)
      .setDescription(stripIndents`${body}`)
      .setFooter({text: `*A poll by ${(interaction.member as GuildMember).displayName}*`});

    await (interaction.channel as TextChannel).send({embeds: [pollEmbed]})
      .then(async (msg:Message) => {
        for (let i = 0; i < optionsArray.length; i += 1) {
          /* eslint-disable no-await-in-loop */
          await msg.react(emojiDict[i + 1 as keyof typeof emojiDict]);
        }
      });

    await interaction.editReply('Done!');
    return true;
  },
};
