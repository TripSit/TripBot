import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {reagents} from '../../../global/commands/g.reagents';
// import log from '../../../global/utils/log';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dReagents: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reagents')
    .setDescription('Display reagent color chart!'),

  async execute(interaction) {
    interaction.reply(await reagents());
    return true;
  },
};
