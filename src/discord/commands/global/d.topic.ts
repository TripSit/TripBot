import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {topic} from '../../../global/commands/g.topic';

export const dtopic: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a random topic!'),
  async execute(interaction) {
    interaction.reply({embeds: [embedTemplate().setDescription(await topic())]});
    return true;
  },
};
