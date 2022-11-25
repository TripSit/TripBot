import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { drug } from '../../../global/commands/g.drug';
import { startLog } from '../../utils/startLog';
import { CbSubstance } from '../../../global/@types/combined.d';
import log from '../../../global/utils/log';

const PREFIX = parse(__filename).name;

export default dDrug;

export const dDrug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('drug')
    .setDescription('Check substance information')
    .addStringOption(option => option.setName('substance')
      .setDescription('Pick a substance!')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const embed = embedTemplate();
    const drugName = interaction.options.getString('substance');
    if (!drugName) {
      embed.setTitle('No drug name was provided');
      interaction.reply({ embeds: [embed] });
      return false;
    }
    const drugData = await drug(drugName) as CbSubstance;
    // log.debug(`[${PREFIX}] drugData: ${JSON.stringify(drugData, null, 2)}`);

    if (drugData === null) {
      embed.setTitle(`${drugName} was not found`);
      embed.setDescription(
        '...this shouldn\'t have happened, please tell the developer!',
      );
      // If this happens then something went wrong with the auto-complete
      interaction.reply({ embeds: [embed] });
      return false;
    }

    if (drugData.summary) {
      embed.setDescription(stripIndents`${drugData.summary}\n\n`);
    }

    embed.setColor(Colors.Purple);
    embed.setTitle(`🌐 ${drugData.name} Information`);
    embed.setURL(`https://wiki.tripsit.me/wiki/${drugName}`);

    if (drugData.aliases) {
      const aliases = `Aliases: ${drugData.aliases.join(', ')}\n\n`;
      embed.addFields({ name: 'Aliases', value: stripIndents`${aliases}`, inline: false });
    }

    if (drugData.interactions) {
      const dangerInt = drugData.interactions.filter(i => i.status === 'Dangerous');
      const dangerNames = dangerInt.map(i => i.name);
      if (dangerNames.length > 0) {
        embed.addFields({ name: '**💀 Dangerous 🛑 Interactions 💀**', value: stripIndents`${dangerNames.join(', ')}`, inline: false }); // eslint-disable-line
      }
    }

    let firstRowColumns = 0;

    // CLASS
    let classInfo = '';
    if (drugData.classes) {
      if (drugData.classes.chemical) {
        classInfo += `**Chemical**: ${drugData.classes.chemical}\n`;
      }
      if (drugData.classes.psychoactive) {
        classInfo += `**Physical**: ${drugData.classes.chemical}\n`;
      }
      embed.addFields({ name: 'ℹ Class', value: stripIndents`${classInfo}`, inline: true });
      firstRowColumns += 1;
    }

    // CROSS TOLLERANCE
    if (drugData.crossTolerances && drugData.crossTolerances.length >= 1) {
      const crossToleranceMap = drugData.crossTolerances
        .map(crossTolerance => crossTolerance[0].toUpperCase() + crossTolerance.substring(1));

      embed.addFields({ name: '🔀 Cross Tolerances', value: stripIndents`${crossToleranceMap.join(', ')}`, inline: true }); // eslint-disable-line
      firstRowColumns += 1;
    }

    // ADDICTION POTENTIAL
    if (drugData.addictionPotential) {
      const addPot = drugData.addictionPotential.toString();
      const capitalized = addPot[0].toUpperCase() + addPot.substring(1);
      embed.addFields({ name: '💔 Addiction Potential', value: stripIndents`${capitalized}`, inline: true });
      firstRowColumns += 1;
    }
    let toleranceAdded = false;
    let toxicityAdded = false;

    if (firstRowColumns > 0 && firstRowColumns < 3) {
      if (drugData.tolerance) {
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

        embed.addFields({ name: '↗ Tolerance', value: stripIndents`${toleranceString}`, inline: true });
        toleranceAdded = true;
        firstRowColumns += 1;
      }
      if (firstRowColumns < 3) {
        if (drugData.toxicity) {
          const toxicityMap = drugData.toxicity.map(toxicity => toxicity[0].toUpperCase() + toxicity.substring(1));
          const toxicityString = toxicityMap.join(', ');
          embed.addFields({ name: '☣ Toxicity', value: stripIndents`${toxicityString}`, inline: true });
          // log.debug(`[${PREFIX}] Added toxicity`);
          toxicityAdded = true;
          firstRowColumns += 1;
        }
      }
      while (firstRowColumns < 3) {
        embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
        firstRowColumns += 1;
      }
    }

    // DOSAGE
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

        // log.debug(`[${PREFIX}] roaNames: ${roaNames}`);

        let dosageColumns = 0;
        roaNames.forEach(roaName => {
          if (dosageColumns < 3) {
            const roaInfo = (drugData.roas as RoaType[]).find((r:RoaType) => r.name === roaName);
            if (!roaInfo) {
              log.error(`[${PREFIX}] Could not find roaInfo for ${roaName}`);
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

        // Make sure there's a newline between the dosages and durations
        if (dosageColumns > 0 && dosageColumns < 3) {
          if (!toleranceAdded) {
            if (drugData.tolerance) {
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

              embed.addFields({ name: '↗ Tolerance', value: stripIndents`${toleranceString}`, inline: true });
              toleranceAdded = true;
              dosageColumns += 1;
            }
          }
          if (!toxicityAdded) {
            if (firstRowColumns < 3) {
              if (drugData.toxicity) {
                const toxicityMap = drugData.toxicity
                  .map(toxicity => toxicity[0].toUpperCase() + toxicity.substring(1));
                const toxicityString = toxicityMap.join(', ');
                embed.addFields({ name: '☣ Toxicity', value: stripIndents`${toxicityString}`, inline: true });
                // log.debug(`[${PREFIX}] Added toxicity A`);
                toxicityAdded = true;
                dosageColumns += 1;
              }
            }
          }

          while (dosageColumns < 3) {
            embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
            dosageColumns += 1;
          }
        }

        // DURATION
        let durationColumns = 0;
        roaNames.forEach(roaName => {
          if (durationColumns < 3) {
            const roaInfo = drugData.roas.find(r => r.name === roaName);
            if (roaInfo) {
              if (roaInfo.duration) {
                let durationString = '';
                roaInfo.duration.forEach(d => {
                  durationString += `${d.name}: ${d.value}\n`;
                });
                embed.addFields({ name: `⏳ Duration (${roaName})`, value: stripIndents`${durationString}`, inline: true }); // eslint-disable-line max-len
                durationColumns += 1;
              }
            }
          }
        });

        if (durationColumns > 0 && durationColumns < 3) {
          if (!toleranceAdded) {
            if (drugData.tolerance) {
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

              embed.addFields({ name: '↗ Tolerance', value: stripIndents`${toleranceString}`, inline: true });
              toleranceAdded = true;
              durationColumns += 1;
            }
          }
          // log.debug(`[${PREFIX}] toxicityAdded: ${toxicityAdded}`);
          if (!toxicityAdded) {
            // log.debug(`[${PREFIX}] toxicityAdded: ${toxicityAdded}`);
            if (durationColumns < 3) {
              if (drugData.toxicity) {
                const toxicityMap = drugData.toxicity
                  .map(toxicity => toxicity[0].toUpperCase() + toxicity.substring(1));
                const toxicityString = toxicityMap.join(', ');
                embed.addFields({ name: '☣ Toxicity', value: stripIndents`${toxicityString}`, inline: true });
                // log.debug(`[${PREFIX}] Added toxicity B`);
                toxicityAdded = true;
                durationColumns += 1;
              }
            }
          }

          while (durationColumns < 3) {
            embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
            durationColumns += 1;
          }
        }
    }

    if (drugData.reagents) {
      embed.addFields({ name: '🔬Reagent Results', value: stripIndents`${drugData.reagents.toString()}`, inline: false }); // eslint-disable-line max-len
    }

    if (!toleranceAdded) {
      if (drugData.tolerance) {
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
        embed.addFields({ name: '↗ Tolerance', value: stripIndents`${toleranceString}`, inline: true });
      }
    }

    if (!toxicityAdded) {
      if (drugData.toxicity) {
        const toxicityMap = drugData.toxicity.map(toxicity => toxicity[0].toUpperCase() + toxicity.substring(1));
        const toxicityString = toxicityMap.join(', ');
        embed.addFields({ name: '☣ Toxicity', value: stripIndents`${toxicityString}`, inline: true });
        // log.debug('Added toxicity C');
      }
    }

    if (drugData.experiencesUrl) {
      embed.addFields({ name: 'Links', value: stripIndents`[Erowid](${drugData.experiencesUrl.toString()})`, inline: false }); // eslint-disable-line max-len
    }

    interaction.reply({ embeds: [embed] });
    return true;
  },
};
