import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
// import { embedTemplate } from '../../utils/embedTemplate';
import { topic } from '../../../global/commands/g.topic';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dTopic;

export const dTopic: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a random topic!'),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: false });
    // interaction.editReply({ embeds: [embedTemplate().setDescription(await topic())] });
    interaction.editReply(`Random New Topic: **${await topic()}**`);
    return true;
  },
};
