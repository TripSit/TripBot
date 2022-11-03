import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {reagents} from '../../../global/commands/g.reagents';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dReagents: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('reagents')
    .setDescription('Display reagent color chart!'),

  async execute(interaction) {
    interaction.reply(await reagents());
    return true;
  },
};
