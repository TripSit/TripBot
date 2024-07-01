/* eslint-disable max-len */
import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
  ColorResolvable,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  calcBenzo, calcDxm, calcKetamine, calcMDMA, calcSolvent, calcSubstance, calcPsychedelics, DxmDataType,
} from '../../../global/commands/g.calc';
import commandContext from '../../utils/context';

const F = f(__filename);

const invalidParametersErrorMsg = 'Invalid values supplied';
const ephemeralMsg = 'Set to "True" to show the response only to you';
const askWeightMsg = 'How much do you weigh?';

/**
 * Utility function to build embeds.
 * @param title
 * @param description
 * @param color
 * @param isError
 * @returns {Promise<EmbedBuilder>}
 */
async function buildCalcEmbed(title: string, description: string, color: ColorResolvable = Colors.Purple, isError: boolean = false):Promise<EmbedBuilder> {
  return embedTemplate()
    .setColor(isError ? Colors.Red : color)
    .setTitle(isError ? 'Error!' : title)
    .setDescription(isError ? stripIndents`There was an error during conversion!
      I've let the developer know, please try again with different parameters!` : description);
}
/**
 * Calls g.calc benzo function with user supplied input and builds an embed out of it.
 * Takes the dose of one specific benzo and uses it to figure out the equivalent dose for another benzo
 * @param interaction
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcBenzo(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const dosage = interaction.options.getNumber('i_have', true);
  const drugA = interaction.options.getString('mg_of', true);
  const drugB = interaction.options.getString('and_i_want_the_dose_of', true);
  const data = await calcBenzo(dosage, drugA, drugB);

  if (dosage < 0.001) {
    return buildCalcEmbed(invalidParametersErrorMsg, 'The parameter \'i_have\' cannot be less than 0.001.', Colors.Red);
  }

  let isError = false;
  if (data === -1) {
    isError = true;
  }

  const embedTitle = `${dosage} mg of ${drugA} about equal to ${data} mg of ${drugB}`;
  const embedDescription = stripIndents`
      **Please make sure to research the substances thoroughly before using them.**
      It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.
      `;
  return buildCalcEmbed(embedTitle, embedDescription, Colors.Red, isError);
}

/**
 * Calls g.calc DXM function with user supplied input and builds an embed out of it. Takes weight for calculations.
 * @param interaction
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcDXM(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  // Calculate each plat min/max value
  const givenWeight = interaction.options.getNumber('calc_weight', true);

  if (givenWeight < 1) {
    return buildCalcEmbed(invalidParametersErrorMsg, 'The parameter \'calc_weight\' cannot be less than 1.', Colors.Red);
  }

  const weightUnits = interaction.options.getString('units', true);
  const taking = interaction.options.getString('taking', true);

  const results = await calcDxm(givenWeight, weightUnits, taking);
  const dosageData = results.data as DxmDataType;
  const { units } = results;

  const embedTitle = 'DXM Dosages';
  const embedDescription = `For a ${givenWeight}${weightUnits} individual taking ${taking}`;
  const embed = await buildCalcEmbed(embedTitle, embedDescription);
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

/**
 * Calls g.calc Ketamine function with user supplied input and build an embed out of it for insuffulation and rectal ROAs.
 * @param interaction
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcKetamine(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const givenWeight = interaction.options.getNumber('weight', true);
  const weightUnits = interaction.options.getString('units', true) as 'kg' | 'lbs';
  const embed = embedTemplate();

  if (weightUnits === 'kg' && (givenWeight > 179 || givenWeight < 1)) {
    embed.setTitle('Please enter a weight less than 179 kg and greater than 1kg.'); // what if a person is 200kg? =(
    return embed;
  }

  if (weightUnits === 'lbs' && (givenWeight > 398 || givenWeight < 1)) {
    embed.setTitle('Please enter a weight less than 398 lbs and greater than 1 lb.'); // what if a person is > 398 lbs? >.<
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

/**
 * Calls g.calc MDMA function with user supplied input and build an embed out of it.
 * Takes weight for calculations and appends extra HR info at the end.
 * @param interaction
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcMDMA(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const givenWeight = interaction.options.getNumber('weight', true);

  if (givenWeight < 1) {
    return buildCalcEmbed(invalidParametersErrorMsg, 'The parameter \'weight\' cannot be less than 1.', Colors.Red);
  }
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

/**
 * Calls g.calc Nasal function with user supplied input and build an embed out of it.
 * It acts as the frontend for determining how to make a nasal spray solution.
 * @param interaction
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcNasal(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const calculationType = interaction.options.getString('calculation_type', true);
  const amount = interaction.options.getNumber('amount', true);
  const desiredMgPerPush = interaction.options.getNumber('desired_mg_per_push', true);
  const mlPerPush = interaction.options.getNumber('ml_per_push', true);

  if (amount < 1 || mlPerPush < 1 || desiredMgPerPush < 0.001) {
    return buildCalcEmbed(
      invalidParametersErrorMsg,
      stripIndents`The parameters \'amount\' and \'mlPerPush\' cannot be less than 1, 
      and the parameter \'desiredMgPerPush\' cannot be less than 0.001.`,
      Colors.Red,
    );
  }

  const imageUrl = 'https://user-images.githubusercontent.com/1836049/218758611-c84f1e34-0f5b-43ac-90da-bd89b028f131.png';
  const embed = embedTemplate()
    .setTitle('Nasal spray calculator')
    .setImage(imageUrl);

  if (calculationType === 'solvent') {
    // eslint-disable-next-line max-len
    // log.debug(F, `amount: ${amount}`);
    // log.debug(F, `desired_mg_per_push: ${desiredMgPerPush}`);
    // log.debug(F, `ml_per_push: ${mlPerPush}`);
    embed.setDescription(`You'll need ~${await calcSolvent(amount, desiredMgPerPush, mlPerPush)}ml of solvent (water)`);
  } else if (calculationType === 'substance') {
    // log.debug(F, `amount: ${amount}`);
    // log.debug(F, `desired_mg_per_push: ${desiredMgPerPush}`);
    // log.debug(F, `ml_per_push: ${mlPerPush}`);
    embed.setDescription(`You'll need ~${await calcSubstance(amount, desiredMgPerPush, mlPerPush)}mg of the substance`);
  }
  return embed;
}

/**
 * Calls g.calc Psychedelic (LSD/Mushrooms only) function with user supplied input and build an embed out of it
 * This particular one is the frontend of a tolerance calculator.
 * @param interaction
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcPsychedelics(
  interaction:ChatInputCommandInteraction,
):Promise<EmbedBuilder> {
  const drugType = interaction.options.getString('drug_type', true);
  const lastDose = interaction.options.getNumber('last_dose_amount', true);
  const desiredDose = interaction.options.getNumber('desired_dose_amount', true);
  const days = interaction.options.getNumber('days', true);

  // This and other instances of these checks in this file fix an issue where supplying 0 could cause an "Infinity g/ug" response and a negative number resulted in NaN.
  if (days < 1 || lastDose < 1 || desiredDose < 1) {
    return buildCalcEmbed(invalidParametersErrorMsg, 'The parameters \'last_dose_amount\', \'desired_dose_amount\', and \'days\' cannot be less than 1.', Colors.Red);
  }

  // Code here inspired by https://codepen.io/cyberoxide/pen/BaNarGd
  // Seems like the original source is offline (https://psychedeliccalc.herokuapp.com)
  const result = await calcPsychedelics(lastDose, days, desiredDose);

  const drug = (drugType === 'lsd') ? 'LSD' : 'Mushrooms';
  const units = (drugType === 'lsd') ? 'ug' : 'g';

  let title = `${result} ${units} of ${drug} is needed to feel the same effects as`;
  if (desiredDose) {
    title = `${title} ${desiredDose} ${units} of ${drug} when ${lastDose} ${units} were taken ${days} days ago.`;
  } else {
    title = `${title} ${lastDose} ${units} of ${drug} taken ${days} days ago.`;
  }

  return buildCalcEmbed(
    title,
    stripIndents`
    This ESTIMATE only works for lysergamides such as LSD and tryptamines such as Magic Mushrooms.
    As all bodies and brains are different, results may vary. 
    [Credit to cyberoxide's Codepen](https://codepen.io/cyberoxide/pen/BaNarGd) and [AdmiralAcid's post on reddit](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/) `,
    Colors.Red,
  );
}

export const dCalc: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Get drug dosage information')
    // BEGIN BENZO SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('benzo')
      .setDescription('Get benzo dosage information')
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
        .setDescription(ephemeralMsg)))
    // END BENZO SUBCOMMAND
    // BEGIN DXM SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('dxm')
      .setDescription('Get DXM dosage information')
      .addNumberOption(option => option.setName('calc_weight')
        .setDescription(askWeightMsg)
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
        .setDescription(ephemeralMsg)))
    // END DXM SUBCOMMAND
    // BEGIN KETAMINE SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('ketamine')
      .setDescription('Get Ketamine dosage information')
      .addNumberOption(option => option.setName('weight')
        .setDescription(askWeightMsg)
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription('In what unit?')
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralMsg)))
    // END KETAMINE SUBCOMMAND
    // BEGIN MDMA SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('mdma')
      .setDescription('Get MDMA dosage information')
      .addNumberOption(option => option.setName('weight')
        .setDescription(askWeightMsg)
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription('In what unit?')
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralMsg)))
    // END MDMA SUBCOMMAND
    // BEGIN NASAL SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('nasal')
      .setDescription('Get nasal solvent/substance information')
      .addStringOption(option => option.setName('calculation_type')
        .setDescription('Are you wanting to calculate the amount of solvent or substance?')
        .setRequired(true)
        .addChoices(
          { name: 'Solvent', value: 'solvent' },
          { name: 'Substance', value: 'substance' },
        ))
      .addNumberOption(option => option.setName('amount')
        .setDescription('Amount of solvent in ml')
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_mg_per_push')
        .setDescription('Desired dose per push in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('ml_per_push')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralMsg)))
    // END NASAL SUBCOMMAND
    // BEGIN PSYCHEDELIC SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('psychedelics')
      .setDescription('Get psychedelic tolerance information')
      .addStringOption(option => option.setName('drug_type')
        .setDescription('Are you wanting to calculate tolerance for LSD or Mushrooms?')
        .setRequired(true)
        .addChoices(
          { name: 'LSD', value: 'lsd' },
          { name: 'Mushrooms', value: 'mushrooms' },
        ))
      .addNumberOption(option => option.setName('last_dose_amount')
        .setDescription('What was your last dose? (e.g 100mcg or 2g)')
        .setRequired(true))
      .addNumberOption(option => option.setName('days')
        .setDescription('How many days has it been since your last dose?')
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_dose_amount')
        .setDescription('What\'s your desired dose?  (e.g 100mcg or 2g)')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralMsg))),
  // END PSYCHEDELIC SUBCOMMAND

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'benzo') {
      await interaction.editReply({ embeds: [await dCalcBenzo(interaction)] });
    } else if (subcommand === 'dxm') {
      await interaction.editReply({ embeds: [await dCalcDXM(interaction)] });
    } else if (subcommand === 'ketamine') {
      await interaction.editReply({ embeds: [await dCalcKetamine(interaction)] });
    } else if (subcommand === 'mdma') {
      await interaction.editReply({ embeds: [await dCalcMDMA(interaction)] });
    } else if (subcommand === 'nasal') {
      await interaction.editReply({ embeds: [await dCalcNasal(interaction)] });
    } else if (subcommand === 'psychedelics') {
      await interaction.editReply({ embeds: [await dCalcPsychedelics(interaction)] });
    } else {
      await interaction.editReply({ embeds: [await buildCalcEmbed('', '', Colors.Red, true)] });
      return false;
    }
    return true;
  },
};

export default dCalc;
