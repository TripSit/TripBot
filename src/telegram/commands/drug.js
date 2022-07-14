'use strict';

const { Composer } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const drugDataAll = require('../../global/assets/data/drug_db_combined.json');
const allComboData = require('../../global/assets/data/combo_definitions.json');

module.exports = Composer.command('drug', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');

  logger.debug(splitCommand[2]);

  const substance = splitCommand[1];

  let section;

  if (splitCommand.length > 2) {
    logger.log(splitCommand[2]);
    section = splitCommand[2];
  } else {
    logger.debug('did not set section!');
  }
  logger.debug(`\n\nSECTION: ${section}\n\n`);

  logger.debug(`[${PREFIX}] starting getDrugInfo with parameter: ${substance}`);

  let drugData = [];

  logger.debug(`[${PREFIX}] All drug data length is: ${Object.keys(drugDataAll).length}`);

  // Loop through the dataset to find the requested drug
  for (let i = 0; i < Object.keys(drugDataAll).length; i += 1) {
    if (drugDataAll[i].name.toLowerCase() === substance.toLowerCase()) {
      // Found the requested drug in the dataset
      logger.debug(`[${PREFIX}] Found substance: ${substance}`);
      drugData = drugDataAll[i];
      break;
    } else if (drugDataAll[i].aliases.includes(substance)) {
      logger.debug(`[${PREFIX} found substance ${drugDataAll[i].name} by alias ${substance}`);
      drugData = drugDataAll[i];
      break;
    }
  }

  // console.log(drugData);

  if (drugData.length === 0) {
    ctx.reply(`🙈 Sorry, i don't know this substance (${substance}). Maybe double-check your spelling`);
    return;
  }

  // Let's begin the substance's name.
  let summary = `${drugData.name}\n\n`;

  if (drugData.aliases) {
    // turn aliases into a string with each alias on a new line
    let aliasString = '';
    for (let i = 0; i < drugData.aliases.length; i += 1) {
      aliasString += `${drugData.aliases[i]}\n`;
    }
    summary += `Also known as: \n${aliasString}\n`;
  }

  // Append the given summary, if available.
  if (drugData.summary) { summary += `${drugData.summary}\n\n`; }

  // Append chemical and psychoactive class informations, if available.
  if (drugData.classes) {
    if (drugData.classes.chemical) { summary += `Chemical Class: \n${drugData.classes.chemical}\n\n`; }
    if (drugData.classes.psychoactive) { summary += `Psychoactive Class: \n${drugData.classes.psychoactive}\n\n`; }
  }

  // Append reagent test results, if available.
  if (drugData.reagents) { summary += `Reagent test results: \n${drugData.reagents}\n\n`; }
  // Append toxicity information if available
  if (drugData.toxicity) { summary += `Toxicity: \n${drugData.toxicity}\n\n`; }
  // Append addiction potential information if available
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
  }

  if (typeof section !== 'undefined' && section) {
    logger.debug(`SECTION: ${section}`);
    if (section.toLowerCase() === 'summary') {
      if (summary !== ' ' && summary !== 'undefined') {
        logger.debug(summary);
        ctx.replyWithHTML(`<b>Summary for ${drugData.name}</b>\n\n${summary}`);
      } else {
        logger.warn(`Could not find a summary for ${substance}. Possible error in dataset?`);
        ctx.reply(`Sorry, there's no summary available for ${substance}`);
      }

      logger.debug(`[${PREFIX}] finished!`);
      return;
    }

    if (section.toLowerCase() === 'dosage') {
      if (dosage !== ' ') {
        const entireMessage = dosage;

        if (entireMessage.length > 4000) {
          const messageLength = Math.ceil(entireMessage.length / 1000);
          let messagesBuilt = 0;
          let messageStart = 0;
          let messageEnd = 1000;
          let messagePart = '';

          while (messagesBuilt < messageLength) {
            messageEnd = entireMessage.lastIndexOf('\n', messageEnd) + 1;

            messagePart = entireMessage.slice(messageStart, messageEnd);

            messageStart = messageEnd;
            messageEnd += 1000;
            messagesBuilt += 1;

            ctx.replyWithHTML(`<b>Dosage information for ${drugData.name}</b>\n<a href="https://wiki.tripsit.me/wiki/${drugData.name}”>Read more on the wiki</a>\n\n${messagePart}`);
          }
        }

        if (entireMessage.length > 0 && entireMessage.length <= 4000) {
          // ctx.replyWithHTML(`<b>Dosage information for ${substance}</b>\n<a href="https://wiki.tripsit.me/wiki/${drugData.name}”>Read more on the wiki</a>\n\n${entireMessage}`);
          ctx.replyWithHTML(`<b>Dosage information for ${drugData.name}</b>\n <a href="https://wiki.tripsit.me/wiki/${drugData.name}">Read more on the wiki</a>\n\n${entireMessage}`);
          return;
        }
      } else {
        logger.warn(`Could not find dosage information for ${substance}. Possible error in dataset?`);
        ctx.reply(`Sorry, there's no dosage information available for ${substance}`);
      }
    }

    if (section.toLowerCase() === 'combos') {
      const comboResults = {
        Dangerous: dangerSection,
        Unsafe: unsafeSection,
        Caution: cautionSection,
        'Low Risk & Decrease': decreaseSection,
        'Low Risk & No Synergy': nosynSection,
        'Low Risk & Synergy': synergySection,
        Unknown: unknownSection,
      };

      for (let i = 0; i < allComboData.length; i += 1) {
        const comboDef = allComboData[i];
        const drugStatus = comboDef.status;
        const {
          emoji,
          definition,
        } = comboDef;
        const sectionResults = comboResults[drugStatus];
        let entireMessage = sectionResults;
        if (sectionResults !== '') entireMessage = `${definition}\n\n${sectionResults}`;
        // logger.debug(`[${PREFIX}] entire_message is ${entire_message}`);
        const title = `${emoji} ${drugStatus} ${emoji}`;

        if (entireMessage.length > 4000) {
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

            ctx.replyWithHTML(`<b>${title}</b>\n<a href="https://wiki.tripsit.me/wiki/${drugData.name}">Read more on the wiki</a>\n\n${messagePart}`);
          }
        }
        if (entireMessage.length > 0 && entireMessage.length <= 4000) {
          ctx.replyWithHTML(`<b>${title}</b>\n<a href="https://wiki.tripsit.me/wiki/${drugData.name}">Read more on the wiki</a>\n\n${entireMessage}`);
        }
      }
    }
  } else {
    ctx.replyWithHTML(`Please enter a 'section' as second argument. Available sections are:\n<b>summary, dosage, combos</b>\nYou can also head over to the <a href="https://wiki.tripsit.me/wiki/${drugData.name}">Wiki page</a> for ${substance}`);
  }
});
