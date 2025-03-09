import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
// import { embedTemplate } from '../../utils/embedTemplate';
import { topic } from '../../../global/commands/g.topic';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dTopic: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a random topic!')
    .setIntegrationTypes([0]),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    // interaction.editReply({ embeds: [embedTemplate().setDescription(await topic())] });
    await interaction.editReply(`Random New Topic: **${await topic()}**`);
    return true;
  },
};

export default dTopic;
