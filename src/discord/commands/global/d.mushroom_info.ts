import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import mushroomInfo from '../../../global/commands/g.mushroomInfo';
import commandContext from '../../utils/context';
import { imageGet } from '../../utils/imageGet';

const F = f(__filename);

const source = 'https://www.oaklandhyphae510.com/post/preliminary-tryptamine-potency-analysis-from-dried-homogenized-fruit-bodies-of-psilocybe-mushrooms';
const disclaimer = 'The following data is based on preliminary research and development methods, does not represent final data and requires further peer review before being taken more seriously than \'interesting\'. However, this does represent meaningful, comparable data to the cultivators, to the consumers, and to the public.';
const article = 'https://tripsitter.com/magic-mushrooms/average-potency/';

async function mushroomPageOneEmbed() {
  return {
    embeds: [embedTemplate()
      .setTitle('Mushroom Potency Info')
      .setColor(Colors.Green)
      .setDescription(`${disclaimer}
    
        For more information check out [the source](${source}) and [this article](${article}).`)
      .setImage('attachment://mushroomInfoA.png')],
    files: [new AttachmentBuilder(await imageGet('mushroomInfoA'))],

    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('mushroomPageTwo')
        .setLabel('Show Visual')
        .setStyle(ButtonStyle.Primary),
    )],
  };
}

async function mushroomPageTwoEmbed() {
  return {
    embeds: [embedTemplate()
      .setTitle('Mushroom Potency Info')
      .setColor(Colors.Green)
      .setDescription(`${disclaimer}
    
        For more information check out [the source](${source}) and [this article](${article}).`)
      .setImage('attachment://mushroomInfoB.png')],
    files: [new AttachmentBuilder(await imageGet('mushroomInfoB'))],

    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('mushroomPageOne')
        .setLabel('Back to Data')
        .setStyle(ButtonStyle.Danger),
    )],

  };
}

export async function mushroomPageOne(
  interaction:ButtonInteraction,
) {
  // await interaction.deferUpdate();
  await interaction.update(await mushroomPageOneEmbed());
}

export async function mushroomPageTwo(
  interaction:ButtonInteraction,
) {
  // await interaction.deferUpdate();
  await interaction.update(await mushroomPageTwoEmbed());
}

export default {
  data: new SlashCommandBuilder()
    .setName('mushroom_info')
    .setDescription('Displays different potencies of mushroom strains.')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    await interaction.editReply(await mushroomPageOneEmbed());
    return true;
  },
} as SlashCommand;
