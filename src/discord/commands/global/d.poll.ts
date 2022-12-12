import {
  SlashCommandBuilder,
  GuildMember,
  Message,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate'; // eslint-disable-line

const F = f(__filename);

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

export default dPoll;

export const dPoll: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Creates a poll!')
    .addStringOption(option => option
      .setName('question')
      .setDescription('What do you want to ask?')
      .setRequired(true))
    .addStringOption(option => option
      .setName('choices')
      .setDescription('CSV of options, EG: "Red, Blue, Green"')
      .setRequired(true)),
  async execute(interaction) {
    startLog(F, interaction);
    // await interaction.deferReply({ephemeral: true});
    // interaction.reply({ content: 'Creating poll...', ephemeral: true });
    const question = interaction.options.getString('question');
    // log.debug(F, `question: ${question}`);
    const optionsString = interaction.options.getString('choices');
    // log.debug(F, `optionsString: ${optionsString}`);
    if (!question || !optionsString) {
      await interaction.reply('You need to provide a question and options!');
      return false;
    }
    const optionsArray = optionsString.split(',');

    if (optionsArray.length > 9) {
      await interaction.reply('You can only have 9 options max!');
      return false;
    }

    if (!interaction.channel) {
      await interaction.reply('You need to be in a channel to use this command!');
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
      .setFooter({ text: `*A poll by ${(interaction.member as GuildMember).displayName}*` });

    await interaction.channel.send({ embeds: [pollEmbed] })
      .then(async (msg:Message) => {
        for (let i = 0; i < optionsArray.length; i += 1) {
          /* eslint-disable no-await-in-loop */
          await msg.react(emojiDict[i + 1 as keyof typeof emojiDict]);
        }
      });

    await interaction.reply('Done!');
    return true;
  },
};
