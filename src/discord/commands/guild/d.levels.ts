import {
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { levels } from '../../../global/commands/g.levels';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dLevels;

export const dLevels: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Get someone\'s current experience levels!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to lookup')),
  async execute(interaction) {
    startLog(F, interaction);
    let member = interaction.options.getMember('user') as GuildMember;
    if (!member) {
      member = interaction.member as GuildMember;
    }
    const response = await levels(member.id);
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
    const embed = embedTemplate()
      .setTitle(`${member.user.username}'s Experience`)
      .setDescription(stripIndents`${response}`);
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
