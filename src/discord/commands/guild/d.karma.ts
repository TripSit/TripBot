import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {karma} from '../../../global/commands/g.karma';
import {startLog} from '../../utils/startLog';
import {embedTemplate} from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

// const karmaQuotes = require('../../../global/assets/data/karma_quotes.json');

export const birthday: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setDescription('Get someone\'s karma!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to lookup')
      .setRequired(true),
    ),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    const member = interaction.options.getMember('user') as GuildMember;

    const response = await karma(member.id);

    const message = `${member.displayName} has received ${response.karma_received} karma and given ${response.karma_given} karma`; // eslint-disable-line max-len

    // const quote = karmaQuotes[Math.floor(Math.random() * karmaQuotes.length)];
    const embed = embedTemplate()
      .setTitle(message);
      // .setFooter({text: `${quote}`});
    interaction.reply({embeds: [embed]});
    return true;
  },
};
