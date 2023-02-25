/* eslint-disable */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcSolvent, calcSubstance } from '../../../global/commands/g.calcNasal';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dTemplate;

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_nasal') // there must be a better name for this
    .setDescription('Calculate how much of a substance or how much solvent you need to mix nose spray')
    .addSubcommand(subcommand => subcommand
      .setName('substance')
      .setDescription('Calculate how much of the substance to use for the given amount of solvent')
      .addNumberOption(option => option.setName('solvent')
        .setDescription('amount of solvent in ml')
        .setRequired(true))
      .addNumberOption(option => option.setName('mgpp')
        .setDescription('Wanted dose per push in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('mlpp')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('solvent')
      .setDescription('Calculate how much solvent to use for the given amount of the substance')
      .addNumberOption(option => option.setName('substance')
        .setDescription('Amount of the substance in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('mgpp')
        .setDescription('Wanted dose in mg per push')
        .setRequired(true))
      .addNumberOption(option => option.setName('mlpp')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true))),


async execute(interaction) {
  const command = interaction.options.getSubcommand();

  

    if(command == "solvent") {
  

      const solvent = await calcSolvent(interaction.options.getNumber('substance') as number, interaction.options.getNumber('mgpp') as number, interaction.options.getNumber('mlpp') as number);
       let solventembed = embedTemplate().setTitle('Nasal spray calculator')
              .setDescription(`You'll need ~${solvent}ml of solvent (water)`);

      interaction.reply({embeds: [solventembed]});
      return true;
}    else if(command == "substance") {
     

      const dose = await calcSubstance(interaction.options.getNumber('solvent') as number, interaction.options.getNumber('mgpp') as number, interaction.options.getNumber('mlpp') as number);
      let substanceembed = embedTemplate()
              .setTitle('Nasal spray calculator')
              .setDescription(`You'll need ~${dose}mg of the substance`);

      interaction.reply({embeds:[substanceembed]});     
      return true;   
}
return false;
  },
};
