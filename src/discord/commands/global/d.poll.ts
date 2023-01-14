import {
  SlashCommandBuilder,
  GuildMember,
  Message,
  ChannelType,
  PermissionResolvable,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate'; // eslint-disable-line
import { hasPermissions } from '../../utils/checkPermissions';

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

    if (interaction.channel.type === ChannelType.DM) {
      await interaction.reply('You can\'t poll yourself!');
      return false;
    }

    if (interaction.channel.type === ChannelType.GuildVoice) {
      await interaction.reply('You can\'t poll a voice channel!');
      return false;
    }

    let body = '';
    for (let i = 0; i < optionsArray.length; i += 1) {
      body += `\n${i + 1}. ${optionsArray[i].trim()}`;
    }

    const pollEmbed = embedTemplate()
      .setAuthor(null)
      .setDescription(stripIndents`${body}`)
      .setFooter({ text: `*A poll by ${(interaction.member as GuildMember).displayName}*` });

    if (question !== undefined && question !== null && question !== '') {
      pollEmbed.setTitle(`**${question}**`);
    }

    const hasPostPermission = hasPermissions(interaction, interaction.channel, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
      'AddReactions' as PermissionResolvable,
    ]);

    if (!hasPostPermission) {
      await interaction.reply({
        content: 'I do not have the right permissions! Please make sure I can View, Send Messages and React to messages here!', // eslint-disable-line
        ephemeral: true,
      });
      return false;
    }

    await interaction.channel.send({ embeds: [pollEmbed] })
      .then(async (msg:Message) => {
        for (let i = 0; i < optionsArray.length; i += 1) {
          /* eslint-disable no-await-in-loop */
          await msg.react(emojiDict[i + 1 as keyof typeof emojiDict]);
        }
      });

    await interaction.reply({ content: 'Done!', ephemeral: true });
    return true;
  },
};
