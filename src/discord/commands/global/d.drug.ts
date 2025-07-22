import type {
  EmbedBuilder,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
} from 'discord.js';

import { stripIndents } from 'common-tags';
import { Colors, MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { CbSubstance as CallbackSubstance } from '../../../global/@types/combined';
import type { SlashCommand } from '../../@types/commandDef';

import { drug } from '../../../global/commands/g.drug';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

interface RoaType {
  dosage?: {
    name: string;
    note?: string;
    value: string;
  }[];
  duration: {
    name: string;
    value: string;
  }[];
  name: string;
}

export async function getDrugInfo(
  drugName: string,
  section?: 'all' | 'dosage' | 'summary',
): Promise<InteractionEditReplyOptions> {
  let embed = embedTemplate();
  log.debug(F, `drugName: ${drugName} | section: ${section}`);

  // if (!drugName) {
  //   embed.setTitle('No drug name was provided');
  //   await interaction.editReply({ embeds: [embed] });
  //   return false;
  // }
  const drugData = await drug(drugName);

  if (!drugData) {
    embed.setTitle(`${drugName} was not found`);
    embed.setDescription(
      stripIndents`...this shouldn\'t have happened, please tell the developer!`,
    );
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
  embed.setTitle(`🌐 ${drugData.name} Information`);
  // embed.setURL(`https://wiki.tripsit.me/wiki/${drugName.replaceAll(' ', '_')}`);
  embed.setURL(drugData.url);

  if (section === 'dosage') {
    embed = await addDosages(embed, drugData);
    return { embeds: [embed] };
  }

  embed = await addSummary(embed, drugData);

  if (section === 'summary') {
    return { embeds: [embed] };
  }

  embed = await addAliases(embed, drugData);
  embed = await addInteractions(embed, drugData);

  let embedRowColumns = 0;

  // CLASS
  if (drugData.classes) {
    embed = await addClasses(embed, drugData);
    embedRowColumns += 1;
  }

  // CROSS TOLERANCE
  if (drugData.crossTolerances && drugData.crossTolerances.length > 0) {
    embed = await addCrossTolerance(embed, drugData);
    embedRowColumns += 1;
  }

  // ADDICTION POTENTIAL
  if (drugData.addictionPotential) {
    embed = await addAddictions(embed, drugData);
    embedRowColumns += 1;
  }

  // Make sure that each column has three rows to utilize space
  let toleranceAdded = false;
  let toxicityAdded = false;

  [embed, toleranceAdded, toxicityAdded] = await fillInColumns(
    embed,
    drugData,
    embedRowColumns,
    toleranceAdded,
    toxicityAdded,
  );

  // Dosage
  if (drugData.roas) {
    // Get a list of drug ROA names
    const roaNames = drugData.roas.map((roa) => roa.name);

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
    for (const roaName of roaNames) {
      if (embedRowColumns < 3) {
        const roaInfo = (drugData.roas as RoaType[]).find((r: RoaType) => r.name === roaName)!;
        if (roaInfo.dosage) {
          let dosageString = '';
          for (const d of roaInfo.dosage) {
            dosageString += `${d.name}: ${d.value}\n`;
          }
          embed.addFields({
            inline: true,
            name: `💊 Dosage (${roaName})`,
            value: stripIndents`${dosageString}`,
          });
          embedRowColumns += 1;
        }
      }
    }

    [embed, toleranceAdded, toxicityAdded] = await fillInColumns(
      embed,
      drugData,
      embedRowColumns,
      toleranceAdded,
      toxicityAdded,
    );

    // DURATION
    [embed, embedRowColumns] = await addDurations(embed, drugData, roaNames);

    [embed, toleranceAdded, toxicityAdded] = await fillInColumns(
      embed,
      drugData,
      embedRowColumns,
      toleranceAdded,
      toxicityAdded,
    );
  }

  // Reagents
  await addReagents(embed, drugData);

  // Tolerance
  if (!toleranceAdded) {
    await addTolerances(embed, drugData);
  }

  // Toxicity
  if (!toxicityAdded) {
    await addToxicities(embed, drugData);
  }

  // Experiences
  await addExperiences(embed, drugData);

  // log.debug(F, `Embed: ${JSON.stringify(embed, null, 2)}`);

  return { embeds: [embed] };
}

async function addAddictions(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
): Promise<EmbedBuilder> {
  if (drugData.addictionPotential) {
    const addPot = drugData.addictionPotential.toString();
    const capitalized = addPot[0].toUpperCase() + addPot.slice(1);
    embed.addFields({
      inline: true,
      name: '💔 Addiction Potential',
      value: stripIndents`${capitalized}`,
    });
  }
  return embed;
}

async function addAliases(embed: EmbedBuilder, drugData: CallbackSubstance): Promise<EmbedBuilder> {
  if (drugData.aliases) {
    const aliases = `Aliases: ${drugData.aliases.join(', ')}\n\n`;
    embed.addFields({ inline: false, name: 'Aliases', value: stripIndents`${aliases}` });
  }
  return embed;
}

async function addClasses(embed: EmbedBuilder, drugData: CallbackSubstance): Promise<EmbedBuilder> {
  let classInfo = '';
  if (drugData.classes) {
    if (drugData.classes.chemical) {
      classInfo += `**Chemical**: ${drugData.classes.chemical}\n`;
    }
    if (drugData.classes.psychoactive) {
      classInfo += `**Physical**: ${drugData.classes.chemical}\n`;
    }
    embed.addFields({ inline: true, name: 'ℹ️ Class', value: stripIndents`${classInfo}` });
  }
  return embed;
}

async function addCrossTolerance(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
): Promise<EmbedBuilder> {
  if (drugData.crossTolerances && drugData.crossTolerances.length > 0) {
    const crossToleranceMap = drugData.crossTolerances.map(
      (crossTolerance) => crossTolerance[0].toUpperCase() + crossTolerance.slice(1),
    );

    embed.addFields({ name: '🔀 Cross Tolerances', value: stripIndents`${crossToleranceMap.join(', ')}`, inline: true }); // eslint-disable-line
  }
  return embed;
}

async function addDosages(embed: EmbedBuilder, drugData: CallbackSubstance): Promise<EmbedBuilder> {
  if (drugData.roas) {
    // Get a list of drug ROA names
    const roaNames = drugData.roas.map((roa) => roa.name);

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
    for (const roaName of roaNames) {
      if (dosageColumns < 3) {
        const roaInfo = (drugData.roas as RoaType[]).find((r: RoaType) => r.name === roaName)!;
        if (roaInfo.dosage) {
          let dosageString = '';
          for (const d of roaInfo.dosage) {
            dosageString += `${d.name}: ${d.value}\n`;
          }
          embed.addFields({
            inline: true,
            name: `💊 Dosage (${roaName})`,
            value: stripIndents`${dosageString}`,
          });
          dosageColumns += 1;
        }
      }
    }
  }
  return embed;
}

async function addDurations(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
  roaNames: string[],
): Promise<[EmbedBuilder, number]> {
  let columns = 0;
  for (const roaName of roaNames) {
    if (columns < 3) {
      if (!drugData.roas) {
        continue;
      }
      const roaInfo = drugData.roas.find((r) => r.name === roaName);
      if (roaInfo?.duration) {
        let durationString = '';
        for (const d of roaInfo.duration) {
          durationString += `${d.name}: ${d.value}\n`;
        }
        embed.addFields({
          inline: true,
          name: `⏳ Duration (${roaName})`,
          value: stripIndents`${durationString}`,
        });
        columns += 1;
      }
    }
  }
  return [embed, columns];
}

async function addExperiences(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
): Promise<EmbedBuilder> {
  if (drugData.experiencesUrl) {
    embed.addFields({
      inline: false,
      name: 'Links',
      value: stripIndents`[Erowid](${drugData.experiencesUrl.toString()})`,
    });
  }
  return embed;
}

async function addInteractions(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
): Promise<EmbedBuilder> {
  if (drugData.interactions) {
    const dangerInt = drugData.interactions.filter((index) => index.status === 'Dangerous');
    const dangerNames = dangerInt.map((index) => index.name);
    if (dangerNames.length > 0) {
      embed.addFields({ name: '**💀 Dangerous 🛑 Interactions 💀**', value: stripIndents`${dangerNames.join(', ')}`, inline: false }); // eslint-disable-line
    }
  }
  return embed;
}

async function addReagents(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
): Promise<EmbedBuilder> {
  if (drugData.reagents) {
    embed.addFields({
      inline: false,
      name: '🔬Reagent Results',
      value: stripIndents`${drugData.reagents.toString()}`,
    });
  }
  return embed;
}

async function addSummary(embed: EmbedBuilder, drugData: CallbackSubstance): Promise<EmbedBuilder> {
  if (drugData.summary) {
    embed.setDescription(stripIndents`${drugData.summary}\n\n`);
  }
  return embed;
}

async function addTolerances(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
): Promise<EmbedBuilder> {
  if (drugData.tolerance) {
    const toleranceHeader = '↗ Tolerance';
    let toleranceString = '';
    if (drugData.tolerance.full) {
      const tolFullCap =
        drugData.tolerance.full[0].toUpperCase() + drugData.tolerance.full.slice(1);
      toleranceString += `Full: ${tolFullCap}\n`;
    }
    if (drugData.tolerance.half) {
      const tolHalfCap =
        drugData.tolerance.half[0].toUpperCase() + drugData.tolerance.half.slice(1);
      toleranceString += `Half: ${tolHalfCap}\n`;
    }
    if (drugData.tolerance.zero) {
      const tolZeroCap =
        drugData.tolerance.zero[0].toUpperCase() + drugData.tolerance.zero.slice(1);
      toleranceString += `Zero: ${tolZeroCap}\n`;
    }
    embed.addFields({
      inline: true,
      name: toleranceHeader,
      value: stripIndents`${toleranceString}`,
    });
  }
  return embed;
}

async function addToxicities(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
): Promise<EmbedBuilder> {
  if (drugData.toxicity) {
    const toxicityHeader = '☣ Toxicity';
    const toxicityMap = drugData.toxicity.map(
      (toxicity) => toxicity[0].toUpperCase() + toxicity.slice(1),
    );
    const toxicityString = toxicityMap.join(', ');
    embed.addFields({ inline: true, name: toxicityHeader, value: stripIndents`${toxicityString}` });
    // log.debug('Added toxicity C');
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

async function fillInColumns(
  embed: EmbedBuilder,
  drugData: CallbackSubstance,
  columns: number,
  toleranceAdded: boolean,
  toxicityAdded: boolean,
): Promise<[EmbedBuilder, boolean, boolean]> {
  let cols = columns;
  let tolAdded = toleranceAdded;
  let toxAdded = toxicityAdded;
  if (columns > 0 && columns < 3) {
    if (!toleranceAdded && drugData.tolerance) {
      await addTolerances(embed, drugData);
      tolAdded = true;
      cols += 1;
    }
    // log.debug(F, `toxicityAdded: ${toxicityAdded}`);
    if (!toxicityAdded && cols < 3) {
      await addToxicities(embed, drugData);
      toxAdded = true;
      cols += 1;
    }

    while (cols < 3) {
      embed.addFields({ inline: true, name: '\u200B', value: '\u200B' });
      cols += 1;
    }
  }
  return [embed, tolAdded, toxAdded];
}

export const dDrug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('drug')
    .setDescription('Check substance information')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addStringOption((option) =>
      option
        .setName('substance')
        .setDescription('Pick a substance!')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('section')
        .setDescription('What section of the info to respond with? (Defaults to all)')
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Dosage', value: 'dosage' },
          { name: 'Summary', value: 'summary' },
        ),
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const section = interaction.options.getString('section') as
      | 'all'
      | 'dosage'
      | 'summary'
      | undefined;
    const drugName = interaction.options.getString('substance', true);
    try {
      await interaction.editReply(await getDrugInfo(drugName, section));
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      const drugInfo = (await getDrugInfo(drugName, section)) as InteractionReplyOptions;
      drugInfo.flags = MessageFlags.Ephemeral;
      await interaction.followUp(drugInfo);
    }
    return true;
  },
};

export default dDrug;
