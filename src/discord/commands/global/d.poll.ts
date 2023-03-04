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
import { checkChannelPermissions } from '../../utils/checkPermissions';

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
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    if (!interaction.channel) {
      await interaction.editReply('You need to be in a channel to use this command!');
      return false;
    }

    if (interaction.channel.type === ChannelType.DM) {
      await interaction.editReply('You can\'t poll yourself!');
      return false;
    }

    if (interaction.channel.type === ChannelType.GuildVoice) {
      await interaction.editReply('You can\'t poll a voice channel!');
      return false;
    }

    const perms = await checkChannelPermissions(interaction.channel, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
      'AddReactions' as PermissionResolvable,
    ]);

    if (!perms.hasPermission) {
      await interaction.editReply({ content: `Please make sure I can ${perms.permission} here!` });
      return false;
    }

    // await interaction.deferReply({ephemeral: true});
    // interaction.editReply({ content: 'Creating poll...': true });
    let question = interaction.options.getString('question');
    // log.debug(F, `question: ${question}`);
    const optionsString = interaction.options.getString('choices');
    // log.debug(F, `optionsString: ${optionsString}`);
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
      .setDescription(stripIndents`${body}`)
      .setFooter({ text: `A poll by ${(interaction.member as GuildMember).displayName}` });

    if (question !== undefined && question !== null && question !== '') {
      // Check if the question has any mentions.
      const mentions = question.match(/<.\d+>/g);
      if (mentions) {
        // log.debug(F, `mentions: ${mentions}`);
        // Loop through each mention and replace it.
        for (const mention of mentions) { // eslint-disable-line
          // log.debug(F, `mention: ${mention}`);
          const fullId = mention.replace(/[<>]/g, '');
          // log.debug(F, `fullId: ${fullId}`);
          // Check to see what kind of prefix the mention has.
          const prefix = fullId[0];
          // log.debug(F, `prefix: ${prefix}`);
          const id = fullId.slice(1);
          // log.debug(F, `id: ${id}`);

          let targetString = 'Unknown User' as string;
          if (prefix === '@') {
            const target = await interaction.guild?.members.fetch(id); // eslint-disable-line
            if (target) {
              targetString = target.displayName;
            }
          } else if (prefix === '#') {
            const target = await interaction.guild?.channels.fetch(id); // eslint-disable-line
            if (target) {
              targetString = target.name;
            }
          } else if (prefix === '&') {
            const target = await interaction.guild?.roles.fetch(id); // eslint-disable-line
            if (target) {
              targetString = target.name;
            }
          }

          // log.debug(F, `targetString: ${targetString}`);

          question = question.replace(mention, targetString);
        }
      }
      // log.debug(F, `question: ${question}`);
      pollEmbed.setTitle(`**${question}**`);
    }

    await interaction.channel.send({ embeds: [pollEmbed] })
      .then(async (msg:Message) => {
        for (let i = 0; i < optionsArray.length; i += 1) {
          /* eslint-disable no-await-in-loop */
          await msg.react(emojiDict[i + 1 as keyof typeof emojiDict]);
        }
      });

    await interaction.editReply({ content: 'Done!' });
    return true;
  },
};
