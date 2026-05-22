import { stripIndents } from 'common-tags';
import {
  Colors,
  EmbedBuilder,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { CbSubstance } from '../../../global/@types/combined';
import { drug } from '../../../global/commands/g.drug';
import { getCommandLocalizations, getLocale, t } from '../../../i18n/index';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

type RoaType = {
  name: string,
  dosage?: {
    name: string,
    value: string,
    note?: string,
  }[],
  duration: {
    name: string,
    value: string,
  }[],
};

async function addSummary(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.summary) {
    embed.setDescription(stripIndents`${drugData.summary}\n\n`);
  }
  return embed;
}

async function addAliases(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.aliases) {
    const aliases = `${t(locale, 'drug.aliases')}: ${drugData.aliases.join(', ')}\n\n`;
    embed.addFields({ name: t(locale, 'drug.aliases'), value: stripIndents`${aliases}`, inline: false });
  }
  return embed;
}

async function addInteractions(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.interactions) {
    const dangerInt = drugData.interactions.filter(i => i.status === 'Dangerous');
    const dangerNames = dangerInt.map(i => i.name);
    if (dangerNames.length > 0) {
      embed.addFields({ name: t(locale, 'drug.dangerousInteractions'), value: stripIndents`${dangerNames.join(', ')}`, inline: false }); // eslint-disable-line
    }
  }
  return embed;
}

async function addClasses(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  let classInfo = '';
  if (drugData.classes) {
    if (drugData.classes.chemical) {
      classInfo += `${t(locale, 'drug.chemical', { value: drugData.classes.chemical })}\n`;
    }
    if (drugData.classes.psychoactive) {
      classInfo += `${t(locale, 'drug.physical', { value: drugData.classes.psychoactive })}\n`;
    }
    embed.addFields({ name: t(locale, 'drug.classHeader'), value: stripIndents`${classInfo}`, inline: true });
  }
  return embed;
}

async function addCrossTolerance(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.crossTolerances && drugData.crossTolerances.length >= 1) {
    const crossToleranceMap = drugData.crossTolerances
      .map(crossTolerance => crossTolerance[0].toUpperCase() + crossTolerance.substring(1));

    embed.addFields({ name: t(locale, 'drug.crossTolerances'), value: stripIndents`${crossToleranceMap.join(', ')}`, inline: true }); // eslint-disable-line
  }
  return embed;
}

async function addAddictions(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.addictionPotential) {
    const addPot = drugData.addictionPotential.toString();
    const capitalized = addPot[0].toUpperCase() + addPot.substring(1);
    embed.addFields({ name: t(locale, 'drug.addictionPotential'), value: stripIndents`${capitalized}`, inline: true });
  }
  return embed;
}

async function addReagents(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.reagents) {
    embed.addFields({ name: t(locale, 'drug.reagents'), value: stripIndents`${drugData.reagents.toString()}`, inline: false }); // eslint-disable-line max-len
  }
  return embed;
}

async function addTolerances(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.tolerance) {
    let toleranceString = '';
    if (drugData.tolerance.full) {
      const tolFullCap = drugData.tolerance.full[0].toUpperCase() + drugData.tolerance.full.substring(1);
      toleranceString += `${t(locale, 'drug.toleranceFull', { value: tolFullCap })}\n`;
    }
    if (drugData.tolerance.half) {
      const tolHalfCap = drugData.tolerance.half[0].toUpperCase() + drugData.tolerance.half.substring(1);
      toleranceString += `${t(locale, 'drug.toleranceHalf', { value: tolHalfCap })}\n`;
    }
    if (drugData.tolerance.zero) {
      const tolZeroCap = drugData.tolerance.zero[0].toUpperCase() + drugData.tolerance.zero.substring(1);
      toleranceString += `${t(locale, 'drug.toleranceZero', { value: tolZeroCap })}\n`;
    }
    embed.addFields({ name: t(locale, 'drug.tolerance'), value: stripIndents`${toleranceString}`, inline: true });
  }
  return embed;
}

async function addToxicities(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.toxicity) {
    const toxicityMap = drugData.toxicity.map(toxicity => toxicity[0].toUpperCase() + toxicity.substring(1));
    const toxicityString = toxicityMap.join(', ');
    embed.addFields({ name: t(locale, 'drug.toxicity'), value: stripIndents`${toxicityString}`, inline: true });
    // log.debug('Added toxicity C');
  }
  return embed;
}

async function addExperiences(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.experiencesUrl) {
    embed.addFields({ name: t(locale, 'drug.links'), value: stripIndents`[${t(locale, 'drug.erowid')}](${drugData.experiencesUrl.toString()})`, inline: false }); // eslint-disable-line max-len
  }
  return embed;
}

async function fillInColumns(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  columns: number,
  toleranceAdded: boolean,
  toxicityAdded: boolean,
  locale: string,
):Promise<[EmbedBuilder, boolean, boolean]> {
  let cols = columns;
  let tolAdded = toleranceAdded;
  let toxAdded = toxicityAdded;
  if (columns > 0 && columns < 3) {
    if (!toleranceAdded && drugData.tolerance) {
      await addTolerances(embed, drugData, locale);
      tolAdded = true;
      cols += 1;
    }
    // log.debug(F, `toxicityAdded: ${toxicityAdded}`);
    if (!toxicityAdded && cols < 3) {
      await addToxicities(embed, drugData, locale);
      toxAdded = true;
      cols += 1;
    }

    while (cols < 3) {
      embed.addFields({ name: '​', value: '​', inline: true });
      cols += 1;
    }
  }
  return [embed, tolAdded, toxAdded];
}

async function addDurations(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  roaNames: string[],
  locale: string,
):Promise<[EmbedBuilder, number]> {
  let columns = 0;
  roaNames.forEach(roaName => {
    if (columns < 3) {
      if (!drugData.roas) {
        return;
      }
      const roaInfo = drugData.roas.find(r => r.name === roaName);
      if (roaInfo && roaInfo.duration) {
        let durationString = '';
        roaInfo.duration.forEach(d => {
          durationString += `${d.name}: ${d.value}\n`;
        });
        embed.addFields({
          name: t(locale, 'drug.duration', { roa: roaName }),
          value: stripIndents`${durationString}`,
          inline: true,
        }); // eslint-disable-line max-len
        columns += 1;
      }
    }
  });
  return [embed, columns];
}

async function addDosages(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  locale: string,
):Promise<EmbedBuilder> {
  if (drugData.roas) {
    // Get a list of drug ROA names
    const roaNames = drugData.roas.map(roa => roa.name);

    // For HR reasons we prefer non-invasive methods
    if (roaNames.includes('Insufflated')) {
      roaNames.splice(roaNames.indexOf('Insufflated'), 1);
      roaNames.unshift('Insufflated');
    }

    if (roaNames.includes('Vapourised')) {
      roaNames.splice(roaNames.indexOf('Vapourised'), 1);
      roaNames.unshift('Vapourised');
    }
    if (roaNames.includes('Smoked')) {
      roaNames.splice(roaNames.indexOf('Smoked'), 1);
      roaNames.unshift('Smoked');
    }

    // For each roaName, get the dosage and duration
    // log.debug(F, `roaNames: ${roaNames}`);

    let dosageColumns = 0;
    roaNames.forEach(roaName => {
      if (dosageColumns < 3) {
        const roaInfo = (drugData.roas as RoaType[]).find((r:RoaType) => r.name === roaName) as RoaType;
        if (roaInfo.dosage) {
          let dosageString = '';
          roaInfo.dosage.forEach(d => {
            dosageString += `${d.name}: ${d.value}\n`;
          });
          embed.addFields({ name: t(locale, 'drug.dosage', { roa: roaName }), value: stripIndents`${dosageString}`, inline: true });
          dosageColumns += 1;
        }
      }
    });
  }
  return embed;
}

// async function addSummary(
//   embed: EmbedBuilder,
//   drugData: CbSubstance,
// ) {
//   if (drugData.summary) {
//     embed.setDescription(stripIndents`${drugData.summary}\n\n`);
//   }
//   return embed;
// }

export async function getDrugInfo(
  drugName: string,
  section?: 'all' | 'dosage' | 'summary',
  locale = 'en',
):Promise<InteractionEditReplyOptions> {
  let embed = embedTemplate();
  log.debug(F, `drugName: ${drugName} | section: ${section}`);

  // if (!drugName) {
  //   embed.setTitle('No drug name was provided');
  //   await interaction.editReply({ embeds: [embed] });
  //   return false;
  // }
  const drugData = await drug(drugName);

  if (!drugData) {
    embed.setTitle(t(locale, 'drug.notFound', { name: drugName }));
    embed.setDescription(stripIndents`${t(locale, 'drug.notFoundDesc')}`);
    // If this happens then something went wrong with the auto-complete
    return { embeds: [embed] };
  }
  // log.debug(F, `drugData: ${JSON.stringify(drugData, null, 2)}`);

  // if (drugData === null) {
  //   embed.setTitle(`${drugName} was not found`);
  //   embed.setDescription(stripIndents`...this shouldn\'t have happened, please tell the developer!`);
  //   // If this happens then something went wrong with the auto-complete
  //   await interaction.editReply({ embeds: [embed] });
  //   return false;
  // }

  // log.debug(F, `section: ${section} | drugName: ${drugName} | drugData: ${JSON.stringify(drugData, null, 2)}`);

  embed.setColor(Colors.Purple);
  embed.setTitle(t(locale, 'drug.title', { name: drugData.name }));
  // embed.setURL(`https://wiki.tripsit.me/wiki/${drugName.replaceAll(' ', '_')}`);
  embed.setURL(drugData.url);

  if (section === 'dosage') {
    embed = await addDosages(embed, drugData, locale);
    return { embeds: [embed] };
  }

  embed = await addSummary(embed, drugData);

  if (section === 'summary') {
    return { embeds: [embed] };
  }

  embed = await addAliases(embed, drugData, locale);
  embed = await addInteractions(embed, drugData, locale);

  let embedRowColumns = 0;

  // CLASS
  if (drugData.classes) {
    embed = await addClasses(embed, drugData, locale);
    embedRowColumns += 1;
  }

  // CROSS TOLERANCE
  if (drugData.crossTolerances && drugData.crossTolerances.length >= 1) {
    embed = await addCrossTolerance(embed, drugData, locale);
    embedRowColumns += 1;
  }

  // ADDICTION POTENTIAL
  if (drugData.addictionPotential) {
    embed = await addAddictions(embed, drugData, locale);
    embedRowColumns += 1;
  }

  // Make sure that each column has three rows to utilize space
  let toleranceAdded = false;
  let toxicityAdded = false;

  [
    embed,
    toleranceAdded,
    toxicityAdded,
  ] = await fillInColumns(
    embed,
    drugData,
    embedRowColumns,
    toleranceAdded,
    toxicityAdded,
    locale,
  );

  // Dosage
  if (drugData.roas) {
    // Get a list of drug ROA names
    const roaNames = drugData.roas.map(roa => roa.name);

    // For HR reasons we prefer non-invasive methods
    if (roaNames.includes('Insufflated')) {
      roaNames.splice(roaNames.indexOf('Insufflated'), 1);
      roaNames.unshift('Insufflated');
    }

    if (roaNames.includes('Vapourised')) {
      roaNames.splice(roaNames.indexOf('Vapourised'), 1);
      roaNames.unshift('Vapourised');
    }
    if (roaNames.includes('Smoked')) {
      roaNames.splice(roaNames.indexOf('Smoked'), 1);
      roaNames.unshift('Smoked');
    }

    // For each roaName, get the dosage and duration
    // log.debug(F, `roaNames: ${roaNames}`);

    embedRowColumns = 0;
    roaNames.forEach(roaName => {
      if (embedRowColumns < 3) {
        const roaInfo = (drugData.roas as RoaType[]).find((r:RoaType) => r.name === roaName) as RoaType;
        if (roaInfo.dosage) {
          let dosageString = '';
          roaInfo.dosage.forEach(d => {
            dosageString += `${d.name}: ${d.value}\n`;
          });
          embed.addFields({ name: t(locale, 'drug.dosage', { roa: roaName }), value: stripIndents`${dosageString}`, inline: true });
          embedRowColumns += 1;
        }
      }
    });

    [
      embed,
      toleranceAdded,
      toxicityAdded,
    ] = await fillInColumns(
      embed,
      drugData,
      embedRowColumns,
      toleranceAdded,
      toxicityAdded,
      locale,
    );

    // DURATION
    [embed, embedRowColumns] = await addDurations(embed, drugData, roaNames, locale);

    [
      embed,
      toleranceAdded,
      toxicityAdded,
    ] = await fillInColumns(
      embed,
      drugData,
      embedRowColumns,
      toleranceAdded,
      toxicityAdded,
      locale,
    );
  }

  // Reagents
  await addReagents(embed, drugData, locale);

  // Tolerance
  if (!toleranceAdded) {
    await addTolerances(embed, drugData, locale);
  }

  // Toxicity
  if (!toxicityAdded) {
    await addToxicities(embed, drugData, locale);
  }

  // Experiences
  await addExperiences(embed, drugData, locale);

  // log.debug(F, `Embed: ${JSON.stringify(embed, null, 2)}`);

  return { embeds: [embed] };
}

export const dDrug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('drug')
    .setNameLocalizations(getCommandLocalizations('drug.commandName'))
    .setDescription('Check substance information')
    .setDescriptionLocalizations(getCommandLocalizations('drug','commandDescription'))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addStringOption(option => option.setName('substance')
      .setDescription('Pick a substance!')
      .setDescriptionLocalizations(getCommandLocalizations('drug.substanceOption'))
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('section')
      .setDescription('What section of the info to respond with? (Defaults to all)')
      .setDescriptionLocalizations(getCommandLocalizations('drug.sectionOption'))
      .addChoices(
        { name: 'All', value: 'all' },
        { name: 'Dosage', value: 'dosage' },
        { name: 'Summary', value: 'summary' },
      ))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')
      .setDescriptionLocalizations(getCommandLocalizations('drug.ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const section = interaction.options.getString('section') as 'all' | 'dosage' | 'summary' | undefined;
    const drugName = interaction.options.getString('substance', true);
    const locale = await getLocale(interaction, 'drug');
    try {
      await interaction.editReply(await getDrugInfo(drugName, section, locale));
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      const drugInfo = await getDrugInfo(drugName, section, locale) as InteractionReplyOptions;
      drugInfo.flags = MessageFlags.Ephemeral;
      await interaction.followUp(drugInfo);
    }
    return true;
  },
};

export default dDrug;
