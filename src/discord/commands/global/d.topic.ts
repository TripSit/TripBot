import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
// import { embedTemplate } from '../../utils/embedTemplate';
import { topic } from '../../../global/commands/g.topic';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default dTopic;

export const dTopic: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a random topic!'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    // interaction.reply({ embeds: [embedTemplate().setDescription(await topic())] });
    interaction.reply(`Random New Topic: **${await topic()}**`);
    return true;
  },
};
