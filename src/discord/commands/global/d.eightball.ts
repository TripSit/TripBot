import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {eightball} from '../../../global/commands/g.eightball';

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('magickball')
      .setDescription('Ask the magick 8-ball a question!')
      .addStringOption((option) => option.setName('question')
          .setDescription('What is your question?')),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    // Get a random answer from the list
    let response = await eightball();
    if (question) {
      response = `${interaction.member} asks: ${question} \n\n ${response}`;
    }
    if (interaction.replied) interaction.followUp(response);
    else interaction.reply(response);
  },
};
