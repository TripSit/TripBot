'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const drugDataAll = require('../../assets/drug_db_combined.json');
const allComboData = require('../../assets/combo_definitions.json');

const PREFIX = path.parse(__filename).name;

const buttonList = [
  new MessageButton().setCustomId('previousbtn').setLabel('Previous').setStyle('DANGER'),
  new MessageButton().setCustomId('nextbtn').setLabel('Next').setStyle('SUCCESS'),
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Check substance information')
    .addStringOption(option => option.setName('substance')
      .setDescription('Pick a substance!')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('section')
      .setDescription('What section?')
      .setRequired(true)
      .addChoice('Summary', 'Summary')
      .addChoice('Dosage', 'Dosage')
      .addChoice('Combos', 'Combos')),

  async execute(interaction, parameters) {
    const substance = interaction.options.getString('substance') || parameters.at(0);
    const section = interaction.options.getString('section') || parameters.at(1);

    logger.debug(`[${PREFIX}] starting getDrugInfo with parameter: ${substance}`);
    // loop through drug_data_all to find the substance
    let drugData = {};
    logger.debug(`[${PREFIX}] All drug data length is: ${Object.keys(drugDataAll).length}`);
    for (let i = 0; i < Object.keys(drugDataAll).length; i += 1) {
      // logger.debug(`[${PREFIX}] drug_data_all[i]['name'] is: ${drug_data_all[i]['name']}`)
      if (drugDataAll[i].name === substance) {
        logger.debug(`[${PREFIX}] found substance: ${substance}`);
        drugData = drugDataAll[i];
        break;
      }
    }

    // logger.debug(`[${PREFIX}] ${drugData}`)

    // TODO: Cleanup
    let summary = `${drugData.name}\n\n`;
    if (drugData.aliases) {
      // turn aliases into a string with each alias on a new line
      let aliasString = '';
      for (let i = 0; i < drugData.aliases.length; i += 1) {
        aliasString += `${drugData.aliases[i]}\n`;
      }
      summary += `Also known as: \n${aliasString}\n`;
    }
    if (drugData.summary) { summary += `${drugData.summary}\n\n`; }
    if (drugData.classes) {
      if (drugData.classes.chemical) { summary += `Chemical Class: \n${drugData.classes.chemical}\n\n`; }
      if (drugData.classes.psychoactive) { summary += `Psychoactive Class: \n${drugData.classes.psychoactive}\n\n`; }
    }
    if (drugData.reagents) { summary += `Reagent test results: \n${drugData.reagents}\n\n`; }
    if (drugData.toxicity) { summary += `Toxicity: \n${drugData.toxicity}\n\n`; }
    if (drugData.addictionPotential) { summary += `Addiction Potential: \n${drugData.addictionPotential}\n\n`; }

    let dosage = '';
    if (drugData.roas) {
      for (let i = 0; i < drugData.roas.length; i += 1) {
        dosage += `${drugData.roas[i].name} Dosage\n`;
        if (drugData.roas[i].bioavailability) {
          dosage += `Bioavailability: ${drugData.roas[i].bioavailability}\n`;
        }
        if (drugData.roas[i].dosage) {
          for (let j = 0; j < drugData.roas[i].dosage.length; j += 1) {
            if (j === 0 && drugData.roas[i].dosage[j].note) {
              dosage += `Note: ${drugData.roas[i].dosage[j].note}\n`;
            }
            dosage += `${drugData.roas[i].dosage[j].name}: ${drugData.roas[i].dosage[j].value}\n`;
          }
        }
        if (drugData.roas[i].duration) {
          dosage += `\n${drugData.roas[i].name} Duration\n`;
          for (let j = 0; j < drugData.roas[i].duration.length; j += 1) {
            if (j === 0 && drugData.roas[i].duration[j].note) {
              dosage += `Note: ${drugData.roas[i].duration[j].note}\n`;
            }
            // eslint-disable-next-line
            // logger.debug(`[${PREFIX}] ${drugData["roas"][i].duration[j].name}: ${drugData["roas"][i].duration[j].value}`)
            dosage += `${drugData.roas[i].duration[j].name}: ${drugData.roas[i].duration[j].value}\n`;
          }
          dosage += '\n';
        }
      }
    }
    // logger.debug(`[${PREFIX}] dosage is: ${dosage.length}`);
    let tolerance = '';
    if (drugData.tolerance) {
      tolerance += '\nTolerance\n';
      if (drugData.tolerance.full) tolerance += `Full: ${drugData.tolerance.full}\n`;
      if (drugData.tolerance.half) tolerance += `Half: ${drugData.tolerance.half}\n`;
      if (drugData.tolerance.zero) tolerance += `Zero: ${drugData.tolerance.zero}\n`;
      if (drugData.crossTolerances) tolerance += `Cross Tolerances:\n${drugData.crossTolerances}\n`;
    }
    dosage += tolerance;

    let dangerSection = '';
    let unsafeSection = '';
    let cautionSection = '';
    let decreaseSection = '';
    let nosynSection = '';
    let synergySection = '';
    let unknownSection = '';
    if (drugData.interactions) {
      // For each interaction status, make a list of those names
      const { interactions } = drugData;
      for (let i = 0; i < interactions.length; i += 1) {
        if (interactions[i].status === 'Dangerous') {
          dangerSection += `${interactions[i].name}\n`;
          if (interactions[i].note) dangerSection += `Note: ${interactions[i].note}\n`;
        } else if (interactions[i].status === 'Unsafe') {
          unsafeSection += `${interactions[i].name}\n`;
          if (interactions[i].note) unsafeSection += `Note: ${interactions[i].note}\n`;
        } else if (interactions[i].status === 'Caution') {
          cautionSection += `${interactions[i].name}\n`;
          if (interactions[i].note) cautionSection += `Note: ${interactions[i].note}\n`;
        } else if (interactions[i].status === 'Low Risk & Decrease') {
          decreaseSection += `${interactions[i].name}\n`;
          if (interactions[i].note) decreaseSection += `Note: ${interactions[i].note}\n`;
        } else if (interactions[i].status === 'Low Risk & No Synergy') {
          nosynSection += `${interactions[i].name}\n`;
          if (interactions[i].note) nosynSection += `Note: ${interactions[i].note}\n`;
        } else if (interactions[i].status === 'Low Risk & Synergy') {
          synergySection += `${interactions[i].name}\n`;
          if (interactions[i].note) synergySection += `Note: ${interactions[i].note}\n`;
        } else if (interactions[i].status === 'Unknown') {
          unknownSection += `${interactions[i].name}\n`;
          if (interactions[i].note) unknownSection += `Note: ${interactions[i].note}\n`;
        }
      }

      // if (dangerSection !== '') {
      //   logger.debug(`[${PREFIX}] danger_section is: ${dangerSection.length}`);
      // }
      // if (unsafeSection !== '') {
      //   logger.debug(`[${PREFIX}] unsafe_section is: ${unsafeSection.length}`);
      // }
      // if (cautionSection !== '') {
      //   logger.debug(`[${PREFIX}] caution_section is: ${cautionSection.length}`);
      // }
      // if (decreaseSection !== '') {
      //   logger.debug(`[${PREFIX}] decrease_section is: ${decreaseSection.length}`);
      // }
      // if (nosynSection !== '') {
      //   logger.debug(`[${PREFIX}] nosyn_section is: ${nosynSection.length}`);
      // }
      // if (synergySection !== '') {
      //   logger.debug(`[${PREFIX}] synergy_section is: ${synergySection.length}`);
      // }
      // if (unknownSection !== '') {
      //   logger.debug(`[${PREFIX}] unknown_section is: ${unknownSection.length}`);
      // }
    }

    if (section === 'Summary') {
      if (summary !== '') {
        // logger.debug(`[${PREFIX}] summary.length: ${summary.length}`);
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE')
          .setTitle(`${substance} Summary`)
          .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
          .setDescription(summary);

        if (!interaction.replied) {
          interaction.reply({
            embeds: [embed],
            ephemeral: false,
          });
        } else {
          interaction.followUp({
            embeds: [embed],
            ephemeral: false,
          });
        }

        logger.debug(`[${PREFIX}] finished!`);
        return;
      }
    }

    if (section === 'Dosage') {
      if (dosage !== '') {
        const entireMessage = dosage;
        const book = [];
        if (entireMessage.length > 1024) {
          // logger.debug(`[${PREFIX}] ${section} is too long at ${entire_message.length}`);
          const messageLength = Math.ceil(entireMessage.length / 1000);
          // logger.debug(`[${PREFIX}] I will make ${message_length} messages`)
          let messagesBuilt = 0;
          let messageStart = 0;
          let messageEnd = 1000;
          let messagePart = '';
          while (messagesBuilt < messageLength) {
            // eslint-disable-next-line
            // logger.debug(`[${PREFIX}] looking for last ) between ${message_start} and ${message_end}`)
            messageEnd = entireMessage.lastIndexOf('\n', messageEnd) + 1;
            // logger.debug(`[${PREFIX}] Found the last newline at ${message_end}`)
            messagePart = entireMessage.slice(messageStart, messageEnd);
            // logger.debug(`[${PREFIX}] message_part is ${message_part}`)
            // logger.debug(`[${PREFIX}] setting new start to ${message_end}`)
            messageStart = messageEnd;
            messageEnd += 1000;
            messagesBuilt += 1;
            const embed = template.embedTemplate()
              .setTitle(`${substance} Dosage`)
              .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
              .setDescription(messagePart);
            book.push(embed);
          }
        }
        if (entireMessage.length > 0 && entireMessage.length <= 1024) {
          // logger.debug(`[${PREFIX}] ${section} is not too long`);
          const embed = template.embedTemplate()
            .setTitle(`${substance} Dosage`)
            .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
            .setDescription(entireMessage);
          await interaction.reply({ embeds: [embed] });
          return;
        }
        if (book.length > 0) {
          paginationEmbed(interaction, book, buttonList);
          logger.debug(`[${PREFIX}] finished!`);
          return;
        }

        // logger.debug(f"[{PREFIX}] No messages to send")
        await interaction.reply(`No dosage information found for ${substance}`);
        logger.debug(`[${PREFIX}] finished!`);
        return;
      }
    }
    if (section === 'Combos') {
      const comboResults = {
        Dangerous: dangerSection,
        Unsafe: unsafeSection,
        Caution: cautionSection,
        'Low Risk & Decrease': decreaseSection,
        'Low Risk & No Synergy': nosynSection,
        'Low Risk & Synergy': synergySection,
        Unknown: unknownSection,
      };
      const book = [];
      // loop through each dictionary in all_combo_data
      // logger.debug(JSON.stringify(all_combo_data))
      for (let i = 0; i < allComboData.length; i += 1) {
        const comboDef = allComboData[i];
        // logger.debug(`[${PREFIX}] combo_def: ${JSON.stringify(combo_def)}`);
        const drugStatus = comboDef.status;
        // logger.debug(`[${PREFIX}] drug_status is ${drugStatus}`);
        const {
          emoji,
          color,
          definition,
          thumbnail,
        } = comboDef;
        const sectionResults = comboResults[drugStatus];
        let entireMessage = sectionResults;
        if (sectionResults !== '') entireMessage = `${definition}\n\n${sectionResults}`;
        // logger.debug(`[${PREFIX}] entire_message is ${entire_message}`);
        const title = `${emoji} ${drugStatus} ${emoji}`;

        if (entireMessage.length > 1024) {
          logger.debug(`[${PREFIX}] ${drugStatus} is too long at ${entireMessage.length}`);
          const messageLength = Math.ceil(entireMessage.length / 1000);
          // logger.debug(`[${PREFIX}] I will make ${message_length} messages`)
          let messagesBuilt = 0;
          let messageStart = 0;
          let messageEnd = 1000;
          let messagePart = '';
          while (messagesBuilt < messageLength) {
            // eslint-disable-next-line
            // logger.debug(`[${PREFIX}] looking for last ) between ${message_start} and ${message_end}`)
            messageEnd = entireMessage.lastIndexOf('\n', messageEnd) + 1;
            // logger.debug(`[${PREFIX}] Found the last newline at ${message_end}`)
            messagePart = entireMessage.slice(messageStart, messageEnd);
            // logger.debug(`[${PREFIX}] message_part is ${message_part}`)
            // logger.debug(`[${PREFIX}] setting new start to ${message_end}`)
            messageStart = messageEnd;
            messageEnd += 1000;
            messagesBuilt += 1;
            const embed = template.embedTemplate()
              .setTitle(`${title}`)
              .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
              .setDescription(messagePart)
              .setColor(color)
              .setThumbnail(thumbnail);
            book.push(embed);
          }
        }
        if (entireMessage.length > 0 && entireMessage.length <= 1024) {
          logger.debug(`[{PREFIX}] ${drugStatus} is not too long`);
          const embed = template.embedTemplate()
            .setTitle(`${title}`)
            .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
            .setDescription(entireMessage)
            .setColor(color)
            .setThumbnail(thumbnail);
          book.push(embed);
        }
      }
      if (book.length > 0) {
        paginationEmbed(interaction, book, buttonList);
        logger.debug(`[${PREFIX}] finished!`);
      } else {
        // logger.debug(f"[{PREFIX}] No messages to send")
        await interaction.reply(`No combo information found for ${substance}`);
        logger.debug(`[${PREFIX}] finished!`);
      }
    }
  },
};
