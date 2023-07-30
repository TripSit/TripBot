/* eslint-disable max-len */
/* eslint-disable eqeqeq */

import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

// const karmaQuotes = require('../../../global/assets/data/karma_quotes.json');

export const dLightJoint: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lightjoint')
    .setDescription('Let\'s sheesh!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to sheesh with')
      .setRequired(false)),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: false });
    const user = interaction.member as GuildMember;
    const member = interaction.options.getMember('user') as GuildMember;
    if (user == member) {
      await interaction.editReply({ content: `<:ts_wellness:1121432396647112725> ${user.displayName} decided to light up joint alone today... <:ts_wellness:1121432396647112725>` });
    } else if (member?.id === '977945272359452713') {
      await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} is blazing with ${member.displayName}! <:ts_bots:979362238253113404> 110100100 blaze it! <:ts_high:979362238349578250>` }); // eslint-disable-line max-len
    } else if (member != null) {
      await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} started sheeshin with ${member.displayName} <:ts_high:979362238349578250>` });
    } else {
      await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} lighted up a joint! <:ts_high:979362238349578250>` });
    }

    return true;
  },
};

export default dLightJoint;
