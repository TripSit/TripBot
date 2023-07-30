/* eslint-disable max-len */
/* eslint-disable linebreak-style */
import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

// const karmaQuotes = require('../../../global/assets/data/karma_quotes.json');

export const dPassJoint: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('passjoint')
    .setDescription('Already puffed? Pass to someone else!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to pass joint to')
      .setRequired(true)),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: false });
    const user = interaction.member as GuildMember;
    const member = interaction.options.getMember('user') as GuildMember;
    if (user === member) {
      await interaction.editReply({ content: `<:ts_memes:1121436581232902155> ${user.displayName} decided to keep joint for themselves! Shame on you! <:ts_memes:1121436581232902155>` });
    } else if (member.id === '977945272359452713') {
      await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} passed joint to TripBot! <:ts_bots:979362238253113404> Hopefully, TripBot gives it back <:ts_memes:1121436581232902155>` }); // eslint-disable-line max-len
    } else {
      await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} passed joint to ${member?.displayName} <:ts_high:979362238349578250>` }); // eslint-disable-line max-len
    }

    return true;
  },
};

export default dPassJoint;
