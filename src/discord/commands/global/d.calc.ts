/* eslint-disable max-len */
import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  calcBenzo, calcDxm, calcKetamine, calcMDMA, calcSolvent, calcSubstance, calcPsychedelics,
} from '../../../global/commands/g.calc';
import commandContext from '../../utils/context';

const F = f(__filename);

type DxmDataType = {
  First: { min: number, max: number };
  Second: { min: number, max: number };
  Third: { min: number, max: number };
  Fourth: { min: number, max: number };
};

async function buildCalcEmbed(title: string, description: string, isError: boolean):Promise<EmbedBuilder> {
  return embedTemplate()
    .setColor(isError ? Colors.Red : Colors.Purple)
    .setTitle(isError ? 'Error!' : title)
    .setDescription(isError ? stripIndents`There was an error during conversion!
      I've let the developer know, please try again with different parameters!` : description);
}

async function dCalcBenzo(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const dosage = interaction.options.getNumber('i_have', true);
  const drugA = interaction.options.getString('mg_of', true);
  const drugB = interaction.options.getString('and_i_want_the_dose_of', true);
  const data = await calcBenzo(dosage, drugA, drugB);

  let error = false;
  if (data === -1) {
    error = true;
  }

  const embedTitle = `${dosage} mg of ${drugA} about equal to ${data} mg of ${drugB}`;
  const embedDescription = stripIndents`
      **Please make sure to research the substances thoroughly before using them.**
      It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.
      `;
  return buildCalcEmbed(embedTitle, embedDescription, false);
}

async function dCalcDXM(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  // Calculate each plat min/max value
  const givenWeight = interaction.options.getNumber('calc_weight', true);
  const weightUnits = interaction.options.getString('units', true);
  const taking = interaction.options.getString('taking', true);

  const results = await calcDxm(givenWeight, weightUnits, taking);
  const dosageData = results.data as DxmDataType;
  const { units } = results;

  const embedTitle = 'DXM Dosages';
  const embedDescription = `For a ${givenWeight}${weightUnits} individual taking ${taking}`;
  const embed = await buildCalcEmbed(embedTitle, embedDescription, false);
  let header = true;
  Object.keys(dosageData).forEach(key => {
    embed.addFields(
      { name: `${header ? 'Plateau' : '\u200B'}`, value: `**${key}**`, inline: true },
      { name: `${header ? 'Minimum' : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].min} ${units}`, inline: true },
      { name: `${header ? 'Maximum' : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].max} ${units}`, inline: true },
    );
    header = false;
  });
  return embed;
}

async function dCalcKetamine(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const givenWeight = interaction.options.getNumber('weight', true);
  const weightUnits = interaction.options.getString('units', true) as 'kg' | 'lbs';
  const embed = embedTemplate();

  if (weightUnits === 'kg' && givenWeight > 179) {
    embed.setTitle('Please enter a weight less than 179 kg.'); // what if a person is 200kg? =(
    return embed;
  }

  if (weightUnits === 'lbs' && givenWeight > 398) {
    embed.setTitle('Please enter a weight less than 398 lbs.');
    return embed;
  }

  const data = await calcKetamine(givenWeight, weightUnits);

  embed.addFields(
    {
      name: 'Insufflated',
      value: stripIndents`${data.insufflated}`,
      inline: true,
    },
    {
      name: 'Rectal',
      value: stripIndents`${data.rectal}`,
      inline: true,
    },
  );
  return embed;
}

async function dCalcMDMA(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const givenWeight = interaction.options.getNumber('weight', true);
  const weightUnits = interaction.options.getString('units', true) as 'kg' | 'lbs';
  const embed = embedTemplate();
  const dosageData = await calcMDMA(givenWeight, weightUnits);

  let description = '**MDMA Dosage Information**\n\n';

  Object.keys(dosageData).forEach(key => {
    const title = key.charAt(0).toUpperCase() + key.slice(1);
    description += `**${title}**: ${dosageData[key as keyof typeof dosageData]}\n`;
  });

  description += '\n';
  description += stripIndents`
    **It is not recommended to exceed 150mg of MDMA in a single session, including any redoses.** \
    As dosage increases, so does the likelihood of experiencing negative side effects. \
    Keeping doses in the light to medium range can help maximize pleasurable effects while minimizing discomfort. \
    For more information check out [RollSafe](https://rollsafe.org/mdma-dosage/).`;
  embed.setDescription(description);
  return embed;
}

async function dCalcNasal(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const command = interaction.options.getSubcommand();
  const imageUrl = 'https://user-images.githubusercontent.com/1836049/218758611-c84f1e34-0f5b-43ac-90da-bd89b028f131.png';
  const embed = embedTemplate()
    .setTitle('Nasal spray calculator')
    .setImage(imageUrl);

  if (command === 'solvent') {
    // eslint-disable-next-line max-len
    // log.debug(F, `substance_amount: ${interaction.options.getNumber('substance_amount')}`);
    // log.debug(F, `desired_mg_per_push: ${interaction.options.getNumber('desired_mg_per_push')}`);
    // log.debug(F, `ml_per_push: ${interaction.options.getNumber('ml_per_push')}`);
    const solvent = await calcSolvent(
      interaction.options.getNumber('substance_amount') as number,
      interaction.options.getNumber('desired_mg_per_push') as number,
      interaction.options.getNumber('ml_per_push') as number,
    );

    embed.setDescription(`You'll need ~${solvent}ml of solvent (water)`);
  } else if (command === 'substance') {
    // log.debug(F, `solvent_amount: ${interaction.options.getNumber('solvent_amount')}`);
    // log.debug(F, `desired_mg_per_push: ${interaction.options.getNumber('desired_mg_per_push')}`);
    // log.debug(F, `ml_per_push: ${interaction.options.getNumber('ml_per_push')}`);
    const dose = await calcSubstance(
      interaction.options.getNumber('solvent_amount') as number,
      interaction.options.getNumber('desired_mg_per_push') as number,
      interaction.options.getNumber('ml_per_push') as number,
    );
    embed.setDescription(`You'll need ~${dose}mg of the substance`);
  }
  return embed;
}

// async function dCalcPsychedelics(
//   interaction:ChatInputCommandInteraction,
// ):Promise<EmbedBuilder> {

// }

export const dCalc: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Get drug dosage information')
    // Benzo subcommand
    .addSubcommand(subcommand => subcommand
      .setName('benzo')
      .setDescription('This tool helps figure out how much of a given benzo dose converts into another benzo dose.')
      .addNumberOption(option => option.setName('i_have')
        .setDescription('mg')
        .setRequired(true))
      .addStringOption(option => option.setName('mg_of')
        .setDescription('Pick the first benzo')
        .setAutocomplete(true)
        .setRequired(true))
      .addStringOption(option => option.setName('and_i_want_the_dose_of')
        .setDescription('Pick the second drug')
        .setAutocomplete(true)
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    // Begin DXM subcommand
    .addSubcommand(subcommand => subcommand
      .setName('dxm')
      .setDescription('Get DXM dosage information')
      .addNumberOption(option => option.setName('calc_weight')
        .setDescription('How much do you weigh?')
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription('In what units?')
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addStringOption(option => option.setName('taking')
        // eslint-disable-next-line max-len
        .setDescription('What are you taking? All products (except RoboTablets) contain DXM hBr.')
        .addChoices(
          { name: 'RoboTablets (30 mg freebase tablets)', value: 'RoboTablets (30 mg tablets)' },
          { name: 'RoboCough (ml HBr)', value: 'RoboCough (ml)' },
          { name: 'Robitussin DX (oz HBr)', value: 'Robitussin DX (oz)' },
          { name: 'Robitussin DX (ml HBr)', value: 'Robitussin DX (ml)' },
          { name: 'Robitussin Gelcaps (15 mg caps HBr)', value: 'Robitussin Gelcaps (15 mg caps)' },
          { name: 'Pure (mg HBr)', value: 'Pure (mg)' },
          { name: '30mg Gelcaps (30 mg HBr caps)', value: '30mg Gelcaps (30 mg caps)' },
        )
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    // Begin Ketamine subcommand
    .addSubcommand(subcommand => subcommand
      .setName('ketamine')
      .setDescription('Get Ketamine dosage information')
      .addNumberOption(option => option.setName('weight')
        .setDescription('How much do you weigh?')
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription('In what unit?')
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    // Begin MDMA subcommand
    .addSubcommand(subcommand => subcommand
      .setName('mdma')
      .setDescription('Get MDMA dosage information')
      .addNumberOption(option => option.setName('weight')
        .setDescription('How much do you weigh?')
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription('In what unit?')
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    // Begin nasal subcommands
    .addSubcommand(subcommand => subcommand // Requires subcommands for this subcommand
      .setName('nasal')
      .setDescription('Get nasal solvent/substance information')
      .addStringOption(option => option.setName('calculation_type')
        .setDescription('Calculate how much solvent to use for substance, or how much substance for the solvent?')
        .setRequired(true)
        .addChoices(
          { name: 'Solvent', value: 'solvent' },
          { name: 'Substance', value: 'substance' },
        ))
      .addNumberOption(option => option.setName('solvent_amount')
        .setDescription('amount of solvent in ml')
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_mg_per_push')
        .setDescription('Wanted dose per push in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('ml_per_push')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    // Begin psychedelic subcommands
    .addSubcommand(subcommand => subcommand // Requires subcommands for this subcommand
      .setName('psychedelics')
      .setDescription('Get psychedelic tolerance information')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const subcommand = interaction.options.getSubcommand();
    // if (subcommand.getSubcommand) WE NEED TO FIGURE OUT HOW TO GET THE SUB COMMANDS CHILD SUB COMMANDS

    // AHHH
    // TODO: Check if switch statement is preferable AND verify we need these to be if if if instead if else if else if else
    if (subcommand === 'benzo') {
      await interaction.editReply({ embeds: [await dCalcBenzo(interaction)] });
    }
    if (subcommand === 'dxm') {
      await interaction.editReply({ embeds: [await dCalcDXM(interaction)] });
    }
    if (subcommand === 'ketamine') {
      await interaction.editReply({ embeds: [await dCalcKetamine(interaction)] });
    }
    if (subcommand === 'mdma') {
      await interaction.editReply({ embeds: [await dCalcMDMA(interaction)] });
    }
    if (subcommand === 'nasal') {
      await interaction.editReply({ embeds: [await dCalcNasal(interaction)] });
    }
    if (subcommand === 'psychedelics') {
      // await interaction.editReply({ embeds: [await dCalcPsychedelics(interaction)] });
    }

    // if (subcommand === 'blackjack') {
    //   await interaction.editReply(await rpgArcade(interaction));
    // }
    // if (subcommand === 'slots') {
    //   await interaction.editReply(await rpgArcade(interaction));
    // }
    return true;
  },
};

export default dCalc;
