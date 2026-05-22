/* eslint-disable max-len */
import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
  ColorResolvable,
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  calcBenzo, calcDxm, calcKetamine, calcMDMA, calcSolvent, calcSubstance, calcPsychedelics, DxmDataType,
} from '../../../global/commands/g.calc';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

/**
 * Utility function to build embeds.
 * @param title
 * @param description
 * @param color
 * @param isError
 * @param locale
 * @returns {Promise<EmbedBuilder>}
 */
async function buildCalcEmbed(title: string, description: string, locale: string, color: ColorResolvable = Colors.Purple, isError: boolean = false):Promise<EmbedBuilder> {
  return embedTemplate()
    .setColor(isError ? Colors.Red : color)
    .setTitle(isError ? t(locale, 'calc.errorTitle') : title)
    .setDescription(isError ? t(locale, 'calc.errorDescription') : description);
}
/**
 * Calls g.calc benzo function with user supplied input and builds an embed out of it.
 * Takes the dose of one specific benzo and uses it to figure out the equivalent dose for another benzo
 * @param interaction
 * @param locale
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcBenzo(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  const dosage = interaction.options.getNumber('i_have', true);
  const drugA = interaction.options.getString('mg_of', true);
  const drugB = interaction.options.getString('and_i_want_the_dose_of', true);
  const data = await calcBenzo(dosage, drugA, drugB);

  if (dosage < 0.001) {
    return buildCalcEmbed(t(locale, 'calc.invalidParameters'), t(locale, 'calc.benzoIHaveValidation'), locale, Colors.Red);
  }

  let isError = false;
  if (data === -1) {
    isError = true;
  }

  const embedTitle = t(locale, 'calc.benzoEmbedTitle', {
    dosage, drugA, data, drugB,
  });
  const embedDescription = t(locale, 'calc.benzoEmbedDesc');
  return buildCalcEmbed(embedTitle, embedDescription, locale, Colors.Red, isError);
}

/**
 * Calls g.calc DXM function with user supplied input and builds an embed out of it. Takes weight for calculations.
 * @param interaction
 * @param locale
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcDXM(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  // Calculate each plat min/max value
  const givenWeight = interaction.options.getNumber('calc_weight', true);

  if (givenWeight < 1) {
    return buildCalcEmbed(t(locale, 'calc.invalidParameters'), t(locale, 'calc.dxmWeightValidation'), locale, Colors.Red);
  }

  const weightUnits = interaction.options.getString('units', true);
  const taking = interaction.options.getString('taking', true);

  const results = await calcDxm(givenWeight, weightUnits, taking);
  const dosageData = results.data as DxmDataType;
  const { units } = results;

  const embedTitle = t(locale, 'calc.dxmEmbedTitle');
  const embedDescription = t(locale, 'calc.dxmEmbedDesc', { weight: givenWeight, units: weightUnits, taking });
  const embed = await buildCalcEmbed(embedTitle, embedDescription, locale);
  let header = true;
  Object.keys(dosageData).forEach(key => {
    embed.addFields(
      { name: `${header ? t(locale, 'calc.dxmPlateauHeader') : '\u200B'}`, value: `**${key}**`, inline: true },
      { name: `${header ? t(locale, 'calc.dxmMinimumHeader') : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].min} ${units}`, inline: true },
      { name: `${header ? t(locale, 'calc.dxmMaximumHeader') : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].max} ${units}`, inline: true },
    );
    header = false;
  });
  return embed;
}

/**
 * Calls g.calc Ketamine function with user supplied input and build an embed out of it for insuffulation and rectal ROAs.
 * @param interaction
 * @param locale
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcKetamine(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  const givenWeight = interaction.options.getNumber('weight', true);
  const weightUnits = interaction.options.getString('units', true) as 'kg' | 'lbs';
  const embed = embedTemplate();

  if (weightUnits === 'kg' && (givenWeight > 179 || givenWeight < 1)) {
    embed.setTitle(t(locale, 'calc.ketamineWeightKgValidation'));
    return embed;
  }

  if (weightUnits === 'lbs' && (givenWeight > 398 || givenWeight < 1)) {
    embed.setTitle(t(locale, 'calc.ketamineWeightLbsValidation'));
    return embed;
  }

  const data = await calcKetamine(givenWeight, weightUnits);

  embed.addFields(
    {
      name: t(locale, 'calc.ketamineInsuffTitle'),
      value: stripIndents`${data.insufflated}`,
      inline: true,
    }, /* Uncomment this when we've implemented a better boofing calculation method
    {
      name: 'Rectal',
      value: stripIndents`${data.rectal}`,
      inline: true,
    }, */
  );
  return embed;
}

/**
 * Calls g.calc MDMA function with user supplied input and build an embed out of it.
 * Takes weight for calculations and appends extra HR info at the end.
 * @param interaction
 * @param locale
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcMDMA(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  const givenWeight = interaction.options.getNumber('weight', true);

  if (givenWeight < 1) {
    return buildCalcEmbed(t(locale, 'calc.invalidParameters'), t(locale, 'calc.mdmaWeightValidation'), locale, Colors.Red);
  }
  const weightUnits = interaction.options.getString('units', true) as 'kg' | 'lbs';
  const embed = embedTemplate();
  const dosageData = await calcMDMA(givenWeight, weightUnits);

  let description = `${t(locale, 'calc.mdmaTitlePrefix')}\n\n`;

  Object.keys(dosageData).forEach(key => {
    const title = key.charAt(0).toUpperCase() + key.slice(1);
    description += `**${title}**: ${dosageData[key as keyof typeof dosageData]}\n`;
  });

  description += '\n';
  description += t(locale, 'calc.mdmaWarning');
  embed.setDescription(description);
  return embed;
}

/**
 * Calls g.calc Nasal function with user supplied input and build an embed out of it.
 * It acts as the frontend for determining how to make a nasal spray solution.
 * @param interaction
 * @param locale
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcNasal(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  const calculationType = interaction.options.getString('calculation_type', true);
  const amount = interaction.options.getNumber('amount', true);
  const desiredMgPerPush = interaction.options.getNumber('desired_mg_per_push', true);
  const mlPerPush = interaction.options.getNumber('ml_per_push', true);

  if (amount < 1 || mlPerPush < 1 || desiredMgPerPush < 0.001) {
    return buildCalcEmbed(
      t(locale, 'calc.invalidParameters'),
      t(locale, 'calc.nasalValidation'),
      locale,
      Colors.Red,
    );
  }

  const imageUrl = 'https://user-images.githubusercontent.com/1836049/218758611-c84f1e34-0f5b-43ac-90da-bd89b028f131.png';
  const embed = embedTemplate()
    .setTitle(t(locale, 'calc.nasalSprayTitle'))
    .setImage(imageUrl);

  if (calculationType === 'solvent') {
    // eslint-disable-next-line max-len
    // log.debug(F, `amount: ${amount}`);
    // log.debug(F, `desired_mg_per_push: ${desiredMgPerPush}`);
    // log.debug(F, `ml_per_push: ${mlPerPush}`);
    const solventAmount = await calcSolvent(amount, desiredMgPerPush, mlPerPush);
    embed.setDescription(t(locale, 'calc.nasalSolventDesc', { amount: solventAmount }));
  } else if (calculationType === 'substance') {
    // log.debug(F, `amount: ${amount}`);
    // log.debug(F, `desired_mg_per_push: ${desiredMgPerPush}`);
    // log.debug(F, `ml_per_push: ${mlPerPush}`);
    const substanceAmount = await calcSubstance(amount, desiredMgPerPush, mlPerPush);
    embed.setDescription(t(locale, 'calc.nasalSubstanceDesc', { amount: substanceAmount }));
  }
  return embed;
}

/**
 * Calls g.calc Psychedelic (LSD/Mushrooms only) function with user supplied input and build an embed out of it
 * This particular one is the frontend of a tolerance calculator.
 * @param interaction
 * @param locale
 * @returns {Promise<EmbedBuilder>}
 */
async function dCalcPsychedelics(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<EmbedBuilder> {
  const drugType = interaction.options.getString('drug_type', true);
  const lastDose = interaction.options.getNumber('last_dose_amount', true);
  const desiredDose = interaction.options.getNumber('desired_dose_amount', true);
  const days = interaction.options.getNumber('days', true);

  // This and other instances of these checks in this file fix an issue where supplying 0 could cause an "Infinity g/ug" response and a negative number resulted in NaN.
  if (days < 1 || lastDose < 1 || desiredDose < 1) {
    return buildCalcEmbed(t(locale, 'calc.invalidParameters'), t(locale, 'calc.psychedelicValidation'), locale, Colors.Red);
  }

  // Code here inspired by https://codepen.io/cyberoxide/pen/BaNarGd
  // Seems like the original source is offline (https://psychedeliccalc.herokuapp.com)
  const result = await calcPsychedelics(lastDose, days, desiredDose);

  const drug = (drugType === 'lsd') ? 'LSD' : 'Mushrooms';
  const units = (drugType === 'lsd') ? 'ug' : 'g';

  let title = t(locale, 'calc.psychedelicTolerance', { amount: result, units, drug });
  if (desiredDose) {
    title = `${title} ${t(locale, 'calc.psychedelicToleranceWithDesiredDose', {
      lastDose, units, days, drug,
    })}`;
  } else {
    title = `${title} ${lastDose} ${units} of ${drug} taken ${days} days ago.`;
  }

  return buildCalcEmbed(
    title,
    t(locale, 'calc.psychedelicEstimate'),
    locale,
    Colors.Red,
  );
}

export const dCalc: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc')
    .setNameLocalizations(getCommandLocalizations('calc.commandName'))
    .setDescription(t('en-US', 'calc.commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('calc.commandDescription'))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    // BEGIN BENZO SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('benzo')
      .setNameLocalizations(getCommandLocalizations('calc.benzoSubcommandName'))
      .setDescription(t('en-US', 'calc.benzoSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('calc.benzoSubcommandDescription'))
      .addNumberOption(option => option.setName('i_have')
        .setDescription(t('en-US', 'calc.benzoIHaveOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.benzoIHaveOption'))
        .setRequired(true))
      .addStringOption(option => option.setName('mg_of')
        .setDescription(t('en-US', 'calc.benzoMgOfOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.benzoMgOfOption'))
        .setAutocomplete(true)
        .setRequired(true))
      .addStringOption(option => option.setName('and_i_want_the_dose_of')
        .setDescription(t('en-US', 'calc.benzoAndIWantOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.benzoAndIWantOption'))
        .setAutocomplete(true)
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'calc.ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ephemeralOption'))))
    // END BENZO SUBCOMMAND
    // BEGIN DXM SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('dxm')
      .setNameLocalizations(getCommandLocalizations('calc.dxmSubcommandName'))
      .setDescription(t('en-US', 'calc.dxmSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('calc.dxmSubcommandDescription'))
      .addNumberOption(option => option.setName('calc_weight')
        .setDescription(t('en-US', 'calc.dxmWeightOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.dxmWeightOption'))
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription(t('en-US', 'calc.dxmUnitsOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.dxmUnitsOption'))
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addStringOption(option => option.setName('taking')
        .setDescription(t('en-US', 'calc.dxmTakingOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.dxmTakingOption'))
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
        .setDescription(t('en-US', 'calc.ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ephemeralOption'))))
    // END DXM SUBCOMMAND
    // BEGIN KETAMINE SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('ketamine')
      .setNameLocalizations(getCommandLocalizations('calc.ketamineSubcommandName'))
      .setDescription(t('en-US', 'calc.ketamineSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('calc.ketamineSubcommandDescription'))
      .addNumberOption(option => option.setName('weight')
        .setDescription(t('en-US', 'calc.ketamineWeightOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ketamineWeightOption'))
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription(t('en-US', 'calc.ketamineUnitsOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ketamineUnitsOption'))
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'calc.ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ephemeralOption'))))
    // END KETAMINE SUBCOMMAND
    // BEGIN MDMA SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('mdma')
      .setNameLocalizations(getCommandLocalizations('calc.mdmaSubcommandName'))
      .setDescription(t('en-US', 'calc.mdmaSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('calc.mdmaSubcommandDescription'))
      .addNumberOption(option => option.setName('weight')
        .setDescription(t('en-US', 'calc.mdmaWeightOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.mdmaWeightOption'))
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription(t('en-US', 'calc.mdmaUnitsOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.mdmaUnitsOption'))
        .addChoices(
          { name: 'kg', value: 'kg' },
          { name: 'lbs', value: 'lbs' },
        )
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'calc.ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ephemeralOption'))))
    // END MDMA SUBCOMMAND
    // BEGIN NASAL SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('nasal')
      .setNameLocalizations(getCommandLocalizations('calc.nasalSubcommandName'))
      .setDescription(t('en-US', 'calc.nasalSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('calc.nasalSubcommandDescription'))
      .addStringOption(option => option.setName('calculation_type')
        .setDescription(t('en-US', 'calc.nasalCalculationTypeOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.nasalCalculationTypeOption'))
        .setRequired(true)
        .addChoices(
          { name: 'Solvent', value: 'solvent' },
          { name: 'Substance', value: 'substance' },
        ))
      .addNumberOption(option => option.setName('amount')
        .setDescription(t('en-US', 'calc.nasalAmountOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.nasalAmountOption'))
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_mg_per_push')
        .setDescription(t('en-US', 'calc.nasalDesiredMgPerPushOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.nasalDesiredMgPerPushOption'))
        .setRequired(true))
      .addNumberOption(option => option.setName('ml_per_push')
        .setDescription(t('en-US', 'calc.nasalMlPerPushOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.nasalMlPerPushOption'))
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'calc.ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ephemeralOption'))))
    // END NASAL SUBCOMMAND
    // BEGIN PSYCHEDELIC SUBCOMMAND
    .addSubcommand(subcommand => subcommand
      .setName('psychedelics')
      .setNameLocalizations(getCommandLocalizations('calc.psychedelicsSubcommandName'))
      .setDescription(t('en-US', 'calc.psychedelicsSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('calc.psychedelicsSubcommandDescription'))
      .addStringOption(option => option.setName('drug_type')
        .setDescription(t('en-US', 'calc.psychedelicsDrugTypeOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.psychedelicsDrugTypeOption'))
        .setRequired(true)
        .addChoices(
          { name: 'LSD', value: 'lsd' },
          { name: 'Mushrooms', value: 'mushrooms' },
        ))
      .addNumberOption(option => option.setName('last_dose_amount')
        .setDescription(t('en-US', 'calc.psychedelicsLastDoseOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.psychedelicsLastDoseOption'))
        .setRequired(true))
      .addNumberOption(option => option.setName('days')
        .setDescription(t('en-US', 'calc.psychedelicsDaysOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.psychedelicsDaysOption'))
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_dose_amount')
        .setDescription(t('en-US', 'calc.psychedelicsDesiredDoseOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.psychedelicsDesiredDoseOption'))
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'calc.ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('calc.ephemeralOption')))) as SlashCommandBuilder,
  // END PSYCHEDELIC SUBCOMMAND

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'calc');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'benzo') {
      await interaction.editReply({ embeds: [await dCalcBenzo(interaction, locale)] });
    } else if (subcommand === 'dxm') {
      await interaction.editReply({ embeds: [await dCalcDXM(interaction, locale)] });
    } else if (subcommand === 'ketamine') {
      await interaction.editReply({ embeds: [await dCalcKetamine(interaction, locale)] });
    } else if (subcommand === 'mdma') {
      await interaction.editReply({ embeds: [await dCalcMDMA(interaction, locale)] });
    } else if (subcommand === 'nasal') {
      await interaction.editReply({ embeds: [await dCalcNasal(interaction, locale)] });
    } else if (subcommand === 'psychedelics') {
      await interaction.editReply({ embeds: [await dCalcPsychedelics(interaction, locale)] });
    } else {
      await interaction.editReply({ embeds: [await buildCalcEmbed('', '', locale, Colors.Red, true)] });
      return false;
    }
    return true;
  },
};

export default dCalc;
