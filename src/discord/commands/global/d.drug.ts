import {
  SlashCommandBuilder,
  Colors,
  EmbedBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { drug } from '../../../global/commands/g.drug';
import { startLog } from '../../utils/startLog';
import { CbSubstance } from '../../../global/@types/combined.d';

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

export default dDrug;

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
):Promise<EmbedBuilder> {
  if (drugData.aliases) {
    const aliases = `Aliases: ${drugData.aliases.join(', ')}\n\n`;
    embed.addFields({ name: 'Aliases', value: stripIndents`${aliases}`, inline: false });
  }
  return embed;
}

async function addInteractions(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.interactions) {
    const dangerInt = drugData.interactions.filter(i => i.status === 'Dangerous');
    const dangerNames = dangerInt.map(i => i.name);
    if (dangerNames.length > 0) {
      embed.addFields({ name: '**💀 Dangerous 🛑 Interactions 💀**', value: stripIndents`${dangerNames.join(', ')}`, inline: false }); // eslint-disable-line
    }
  }
  return embed;
}

async function addClasses(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  let classInfo = '';
  if (drugData.classes) {
    if (drugData.classes.chemical) {
      classInfo += `**Chemical**: ${drugData.classes.chemical}\n`;
    }
    if (drugData.classes.psychoactive) {
      classInfo += `**Physical**: ${drugData.classes.chemical}\n`;
    }
    embed.addFields({ name: 'ℹ Class', value: stripIndents`${classInfo}`, inline: true });
  }
  return embed;
}

async function addCrosstolerance(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.crossTolerances && drugData.crossTolerances.length >= 1) {
    const crossToleranceMap = drugData.crossTolerances
      .map(crossTolerance => crossTolerance[0].toUpperCase() + crossTolerance.substring(1));

    embed.addFields({ name: '🔀 Cross Tolerances', value: stripIndents`${crossToleranceMap.join(', ')}`, inline: true }); // eslint-disable-line
  }
  return embed;
}

async function addAddictions(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.addictionPotential) {
    const addPot = drugData.addictionPotential.toString();
    const capitalized = addPot[0].toUpperCase() + addPot.substring(1);
    embed.addFields({ name: '💔 Addiction Potential', value: stripIndents`${capitalized}`, inline: true });
  }
  return embed;
}

async function addReagents(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.reagents) {
    embed.addFields({ name: '🔬Reagent Results', value: stripIndents`${drugData.reagents.toString()}`, inline: false }); // eslint-disable-line max-len
  }
  return embed;
}

async function addTolerances(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.tolerance) {
    const toleranceHeader = '↗ Tolerance';
    let toleranceString = '';
    if (drugData.tolerance.full) {
      const tolFullCap = drugData.tolerance.full[0].toUpperCase() + drugData.tolerance.full.substring(1);
      toleranceString += `Full: ${tolFullCap}\n`;
    }
    if (drugData.tolerance.half) {
      const tolHalfCap = drugData.tolerance.half[0].toUpperCase() + drugData.tolerance.half.substring(1);
      toleranceString += `Half: ${tolHalfCap}\n`;
    }
    if (drugData.tolerance.zero) {
      const tolZeroCap = drugData.tolerance.zero[0].toUpperCase() + drugData.tolerance.zero.substring(1);
      toleranceString += `Zero: ${tolZeroCap}\n`;
    }
    embed.addFields({ name: toleranceHeader, value: stripIndents`${toleranceString}`, inline: true });
  }
  return embed;
}

async function addToxicities(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.toxicity) {
    const toxicityHeader = '☣ Toxicity';
    const toxicityMap = drugData.toxicity.map(toxicity => toxicity[0].toUpperCase() + toxicity.substring(1));
    const toxicityString = toxicityMap.join(', ');
    embed.addFields({ name: toxicityHeader, value: stripIndents`${toxicityString}`, inline: true });
    // log.debug('Added toxicity C');
  }
  return embed;
}

async function addExperiences(
  embed: EmbedBuilder,
  drugData: CbSubstance,
):Promise<EmbedBuilder> {
  if (drugData.experiencesUrl) {
    embed.addFields({ name: 'Links', value: stripIndents`[Erowid](${drugData.experiencesUrl.toString()})`, inline: false }); // eslint-disable-line max-len
  }
  return embed;
}

async function fillInColumns(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  columns: number,
  toleranceAdded: boolean,
  toxicityAdded: boolean,
):Promise<[EmbedBuilder, boolean, boolean]> {
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
      embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
      cols += 1;
    }
  }
  return [embed, tolAdded, toxAdded];
}

async function addDurations(
  embed: EmbedBuilder,
  drugData: CbSubstance,
  roaNames: string[],
):Promise<[EmbedBuilder, number]> {
  let columns = 0;
  roaNames.forEach(roaName => {
    if (columns < 3) {
      const roaInfo = drugData.roas.find(r => r.name === roaName);
      if (roaInfo && roaInfo.duration) {
        let durationString = '';
        roaInfo.duration.forEach(d => {
          durationString += `${d.name}: ${d.value}\n`;
        });
        embed.addFields({
          name: `⏳ Duration (${roaName})`,
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
):Promise<EmbedBuilder> {
  if (drugData.roas) {
    // Get a list of drug ROA names
    const roaNames = drugData.roas.map(roa => roa.name);

    // For HR reasons we prefer non-invasive methods
    if (roaNames.indexOf('Insufflated') > 0) {
      roaNames.splice(roaNames.indexOf('Insufflated'), 1);
      roaNames.unshift('Insufflated');
    }

    if (roaNames.indexOf('Vapourised') > 0) {
      roaNames.splice(roaNames.indexOf('Vapourised'), 1);
      roaNames.unshift('Vapourised');
    }
    if (roaNames.indexOf('Smoked') > 0) {
      roaNames.splice(roaNames.indexOf('Smoked'), 1);
      roaNames.unshift('Smoked');
    }

    // For each roaName, get the dosage and duration
    // log.debug(F, `roaNames: ${roaNames}`);

    let dosageColumns = 0;
    roaNames.forEach(roaName => {
      if (dosageColumns < 3) {
        const roaInfo = (drugData.roas as RoaType[]).find((r:RoaType) => r.name === roaName);
        if (!roaInfo) {
          log.error(F, `Could not find roaInfo for ${roaName}`);
          return;
        }
        if (roaInfo.dosage) {
          let dosageString = '';
          roaInfo.dosage.forEach(d => {
            dosageString += `${d.name}: ${d.value}\n`;
          });
          embed.addFields({ name: `💊 Dosage (${roaName})`, value: stripIndents`${dosageString}`, inline: true });
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

export const dDrug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('drug')
    .setDescription('Check substance information')
    .addStringOption(option => option.setName('substance')
      .setDescription('Pick a substance!')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('response')
      .setDescription('What info to respond with? (Defaults to all)')
      .addChoices(
        { name: 'All', value: 'all' },
        { name: 'Dosage', value: 'dosage' },
        { name: 'Summary', value: 'summary' },
      ))
    .addBooleanOption(option => option.setName('public')
      .setDescription('Post result in chat? (Defaults to true)')),
  async execute(interaction) {
    startLog(F, interaction);
    let embed = embedTemplate();
    // Check if the interaction is coming from DM
    const ephemeral = !(interaction.options.getBoolean('public') ?? true);
    if (interaction.channelId !== null && !ephemeral) {
      embed.setFooter({ text: 'You can use this command in DM for privacy if you want!' });
    }
    log.debug(F, `ephemeral: ${ephemeral}`);
    const drugName = interaction.options.getString('substance');
    if (!drugName) {
      embed.setTitle('No drug name was provided');
      interaction.reply({ embeds: [embed], ephemeral: true });
      return false;
    }
    const drugData = await drug(drugName) as CbSubstance;
    // log.debug(F, `drugData: ${JSON.stringify(drugData, null, 2)}`);

    if (drugData === null) {
      embed.setTitle(`${drugName} was not found`);
      embed.setDescription(
        '...this shouldn\'t have happened, please tell the developer!',
      );
      // If this happens then something went wrong with the auto-complete
      interaction.reply({ embeds: [embed], ephemeral: true });
      return false;
    }

    const response = interaction.options.getString('response');

    embed.setColor(Colors.Purple);
    embed.setTitle(`🌐 ${drugData.name} Information`);
    embed.setURL(`https://wiki.tripsit.me/wiki/${drugName}`);

    if (response === 'dosage') {
      embed = await addDosages(embed, drugData);
      interaction.reply({ embeds: [embed], ephemeral });
      return true;
    }

    embed = await addSummary(embed, drugData);

    if (response === 'summary') {
      interaction.reply({ embeds: [embed], ephemeral });
      return true;
    }

    embed = await addAliases(embed, drugData);
    embed = await addInteractions(embed, drugData);

    let embedRowColumns = 0;

    // CLASS
    if (drugData.classes) {
      embed = await addClasses(embed, drugData);
      embedRowColumns += 1;
    }

    // CROSS TOLLERANCE
    if (drugData.crossTolerances && drugData.crossTolerances.length >= 1) {
      embed = await addCrosstolerance(embed, drugData);
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
    );

    // Dosage
    if (drugData.roas) {
      // Get a list of drug ROA names
      const roaNames = drugData.roas.map(roa => roa.name);

      // For HR reasons we prefer non-invasive methods
      if (roaNames.indexOf('Insufflated') > 0) {
        roaNames.splice(roaNames.indexOf('Insufflated'), 1);
        roaNames.unshift('Insufflated');
      }

      if (roaNames.indexOf('Vapourised') > 0) {
        roaNames.splice(roaNames.indexOf('Vapourised'), 1);
        roaNames.unshift('Vapourised');
      }
      if (roaNames.indexOf('Smoked') > 0) {
        roaNames.splice(roaNames.indexOf('Smoked'), 1);
        roaNames.unshift('Smoked');
      }

      // For each roaName, get the dosage and duration
      // log.debug(F, `roaNames: ${roaNames}`);

      embedRowColumns = 0;
      roaNames.forEach(roaName => {
        if (embedRowColumns < 3) {
          const roaInfo = (drugData.roas as RoaType[]).find((r:RoaType) => r.name === roaName);
          if (!roaInfo) {
            log.error(F, `Could not find roaInfo for ${roaName}`);
            return;
          }
          if (roaInfo.dosage) {
            let dosageString = '';
            roaInfo.dosage.forEach(d => {
              dosageString += `${d.name}: ${d.value}\n`;
            });
            embed.addFields({ name: `💊 Dosage (${roaName})`, value: stripIndents`${dosageString}`, inline: true });
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
      );

      // DURATION
      [embed, embedRowColumns] = await addDurations(embed, drugData, roaNames);

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

    interaction.reply({ embeds: [embed], ephemeral });

    return true;
  },
};
