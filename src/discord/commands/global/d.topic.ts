import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {topic} from '../../../global/commands/g.topic';

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('topic')
      .setDescription('Sends a random topic!'),
  async execute(interaction) {
    interaction.reply({embeds: [embedTemplate().setDescription(await topic())]});
  },
};
