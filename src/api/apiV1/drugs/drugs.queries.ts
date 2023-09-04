// @ts-nocheck
/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable sonarjs/no-duplicate-string */
import _ from 'underscore';
import DatabaseDriver from './database';
import drugData from '../../../global/assets/data/drug_db_tripsit.json';
import categoryData from '../../../global/assets/data/categories.json';
import comboData from '../../../global/assets/data/combo.json';

const F = f(__filename);

// This first part initializes the database
// This is done via the databank module, which is a wrapper for the redis and disk modules.
// I only learned enough about this module to get it working, so I don't know a lot of specifics
const ddb = new DatabaseDriver();
ddb.createDB('', 'redis', {}, () => {});
const db = ddb.databank;

// Now we load the drug data into the database
// I couldn't figure out how tripbot does this, complete mystery, spent several hours on it
// So i'm just hoping that it uses the same database file that like /combos uses
const updateDrugs = Object.keys(drugData).map(drugName => {
  const drug = drugData[drugName];
  // log.debug(F, `category: ${JSON.stringify(category)}`);

  return new Promise((resolve, reject) => {
    db.save('drugs', drugName.toLowerCase(), drug, err => {
      if (err) {
        log.error(`Error adding ${drugName.toLowerCase()}: ${err}`);
        reject(err);
      } else {
        // log.debug(F, `Added : ${drugName.toLowerCase()} : ${JSON.stringify(drug).length}`);
        resolve();
      }
    });
  });
});

const updateCategories = Object.keys(categoryData).map(categoryName => {
  const category = categoryData[categoryName];
  // log.debug(F, `category: ${JSON.stringify(category)}`);

  return new Promise((resolve, reject) => {
    db.save('drug_categories', categoryName.toLowerCase(), category, err => {
      if (err) {
        log.error(`Error adding ${categoryName.toLowerCase()}: ${err}`);
        reject(err);
      } else {
        // log.debug(F, `Added : ${categoryName.toLowerCase()} : ${JSON.stringify(category).length}`);
        resolve();
      }
    });
  });
});

Promise.all(updateDrugs, updateCategories)
  .then(() => log.debug(F, 'All drugs and categories updated successfully.'))
  .catch(err => log.error(F, `Error adding categories: ${err}`));

// The rest of this code is copied from tripbot, with some minor modifications
// I did as few changes as possible to get rid of the critical errors to let this run
// I have no intention of updating this API, so I don't care if it's not perfect
// We will work on a new API with standardized data
export default {
  async getInteraction(
    drugAInput:string,
    drugBInput:string,
  ):Promise<any> {
    return new Promise(async resolve => {
      log.debug(F, `getInteraction | drugA: ${drugAInput}, drugB: ${drugBInput}`);

      let drugAName = drugAInput.toLowerCase();
      let drugBName = drugBInput.toLowerCase(); drugAName = drugAName.toLowerCase();
      drugBName = drugBName.toLowerCase();

      if (drugAName === 'ssri' || drugAName === 'snri' || drugAName === 'snris') {
        drugAName = 'ssris';
      } else if (drugAName === 'maoi') {
        drugAName = 'maois';
      }

      if (drugBName === 'ssri' || drugBName === 'snri' || drugBName === 'snris') {
        drugBName = 'ssris';
      } else if (drugBName === 'maoi') {
        drugBName = 'maois';
      }

      const drugA = await this.getDrug(drugAName);
      // log.debug(F, `drugA: ${JSON.stringify(drugA)}`);
      if (!_.has(drugA, 'err') || _.has(comboData, drugAName)) {
        log.debug(F, 'Drug A found.');
        const drugB = await this.getDrug(drugBName);
        // log.debug(F, `drugB: ${JSON.stringify(drugA)}`);
        if (!_.has(drugB, 'err') || _.has(comboData, drugBName)) {
          log.debug(F, 'Drug B found.');
          let safetyCategoryA = null;
          let safetyCategoryB = null;

          if (_.has(drugB.combos, drugAName)) {
            safetyCategoryA = drugAName;
          } else if (_.has(comboData, drugA.name)) {
            safetyCategoryA = drugA.name;
          } else if (drugA.name.match(/^do.$/i)) {
            safetyCategoryA = 'dox';
          } else if (drugA.name.match(/^2c-.$/i)) {
            safetyCategoryA = '2c-x';
          } else if (drugA.name.match(/^25.-nbome/i)) {
            safetyCategoryA = 'nbomes';
          } else if (drugA.name.match(/^5-meo-..t$/i)) {
            safetyCategoryA = '5-meo-xxt';
          } else if (_.include(drugA.categories, 'benzodiazepine')) {
            safetyCategoryA = 'benzodiazepines';
          } else if (_.include(drugA.categories, 'opioid')) {
            safetyCategoryA = 'opioids';
          } else if (_.include(drugB.categories, 'benzos')) {
            safetyCategoryB = 'benzodiazepines';
          } else if (drugA.name === 'ghb' || drugA.name === 'gbl') {
            safetyCategoryA = 'ghb/gbl';
          }
          if (_.has(drugA.combos, drugBName)) {
            safetyCategoryB = drugBName;
          } else if (_.has(drugA.combos, drugB.name)) {
            safetyCategoryB = drugB.name;
          } else if (drugB.name.match(/^do.$/i)) {
            safetyCategoryB = 'dox';
          } else if (drugB.name.match(/^2c-.$/i)) {
            safetyCategoryB = '2c-x';
          } else if (drugB.name.match(/^25.-nbome/i)) {
            safetyCategoryB = 'nbomes';
          } else if (drugB.name.match(/^5-meo-..t$/i)) {
            safetyCategoryB = '5-meo-xxt';
          } else if (_.include(drugB.categories, 'benzodiazepine')) {
            safetyCategoryB = 'benzodiazepines';
          } else if (_.include(drugB.categories, 'opioid')) {
            safetyCategoryB = 'opioids';
          } else if (_.include(drugB.categories, 'benzos')) {
            safetyCategoryB = 'benzodiazepines';
          } else if (drugB.name === 'ghb' || drugB.name === 'gbl') {
            safetyCategoryB = 'ghb/gbl';
          }

          log.debug(F, 'Safety categories found.');
          log.debug(F, `safetyCategoryA: ${safetyCategoryA}, safetyCategoryB: ${safetyCategoryB}`);
          log.debug(F, `drugA.combos: ${JSON.stringify(drugA.combos)}`);
          log.debug(F, `drugB.combos: ${JSON.stringify(drugB.combos)}`);

          if (safetyCategoryA && safetyCategoryB) {
            if (safetyCategoryA !== safetyCategoryB) {
              const result = _.clone(comboData[safetyCategoryA][safetyCategoryB]);
              log.debug(F, `result: ${JSON.stringify(result)}`);
              resolve({
                result,
                interactionCategoryA: safetyCategoryA,
                interactionCategoryB: safetyCategoryB,
              });
            }
            if (safetyCategoryA === 'benzodiazepines') {
              resolve({ err: true, code: 'ssb', msg: 'Drug A and B are the same safety category.' });
            }
            resolve({ err: true, code: 'ssc', msg: 'Drug A and B are the same safety category.' });
          }
          resolve({ err: true, msg: 'Unknown interaction. This does not mean it is safe, it means we dont have information on it!' });
        }
        resolve({ err: true, msg: 'Drug B not found.' });
      } else {
        log.debug(F, 'Drug A not found.');
        resolve({ err: true, msg: 'Drug A not found.' });
      }
    });
  },

  async getDrug(drugName:string):Promise<any> {
    return new Promise(resolve => {
      // log.debug(F, `getDrug2 | drugName: ${drugName}`);
      const name = drugName.toLowerCase();
      db.read('drugs', name, (err, drug) => {
        // log.debug(F, `getDrug2 | drugName: ${drugName}, drug: ${JSON.stringify(drug)}`);
        if (!drug) {
          log.debug(F, `${name} not found in keys, doing a scan!`);
          db.scan('drugs', dMatch => {
            if (_.include(dMatch.aliases, name)) {
              drug = dMatch;
              if (!_.isUndefined(drug.aliases)) drug.properties.aliases = drug.aliases;
            }
          }, () => {
            if (drug) {
              if (!_.isUndefined(drug.aliases)) drug.properties.aliases = drug.aliases;
              if (!_.isUndefined(drug.categories)) drug.properties.categories = drug.categories;

              if (_.has(comboData, drug.name)) {
                drug.combos = comboData[drug.name];
              }

              if (_.has(drug.properties, 'dose')) {
                const doses = drug.properties.dose.split('|');
                const regex = /(([\w-]+):\s([/.\w\d-+µ]+))/ig;
                drug.formatted_dose = {};
                if (doses.length > 1 || !doses[0].split(' ')[0].match(':')) {
                  _.each(doses, dString => {
                    dString = dString.replace(/\s\s+/g, ' ');
                    const roa = dString.trim().split(' ')[0];
                    let match = regex.exec(dString);
                    if (roa.match(/note/i)) {
                      drug.dose_note = dString;
                    } else {
                      drug.formatted_dose[roa] = {};
                      while (match !== null) {
                        drug.formatted_dose[roa][match[2]] = match[3];
                        match = regex.exec(dString);
                      }
                    }
                  });
                } else {
                  const roa = 'Oral';
                  let match = regex.exec(doses[0]);
                  if (roa.match(/note/i)) {
                    drug.dose_note = doses[0];
                  } else {
                    drug.formatted_dose[roa] = {};
                    while (match !== null) {
                      drug.formatted_dose[roa][match[2]] = match[3];
                      match = regex.exec(doses[0]);
                    }
                  }
                }
              }
              if (_.has(drug.properties, 'effects')) {
                drug.formatted_effects = _.collect(drug.properties.effects.split(/[.,]+/), item => item.trim());
              }

              if (_.has(drug.properties, 'duration')) {
                const roas = drug.properties.duration.split('|');
                drug.formatted_duration = {};
                if (roas.length > 1 || roas[0].match(':')) {
                  _.each(roas, roa => {
                    if (roa.toLowerCase().match('note')) {
                      return;
                    }
                    const match = roa.match(/([\w-/]+):?\s([.\w\d-+]+)/i);
                    if (match) {
                      drug.formatted_duration[match[1]] = match[2];
                    }
                  });
                } else {
                  const match = drug.properties.duration.match(/([.\w\d-+]+)/i);
                  drug.formatted_duration = { value: match[1] };
                }
                if (drug.properties.duration.indexOf('minutes') !== -1) {
                  drug.formatted_duration._unit = 'minutes';
                }
                if (drug.properties.duration.indexOf('hours') !== -1) {
                  drug.formatted_duration._unit = 'hours';
                }
              }

              if (_.has(drug.properties, 'onset')) {
                const roas = drug.properties.onset.split('|');
                drug.formatted_onset = {};
                if (roas.length > 1 || roas[0].match(':')) {
                  _.each(roas, roa => {
                    if (roa.toLowerCase().match('note')) {
                      return;
                    }
                    const match = roa.match(/([\w-/]+):?\s([.\w\d-+]+)/i);
                    if (match) {
                      drug.formatted_onset[match[1]] = match[2];
                    }
                  });
                } else {
                  const match = drug.properties.onset.match(/([.\w\d-+]+)/i);
                  drug.formatted_onset = { value: match[1] };
                }
                if (drug.properties.onset.indexOf('minutes') !== -1) {
                  drug.formatted_onset._unit = 'minutes';
                }
                if (drug.properties.onset.indexOf('hours') !== -1) {
                  drug.formatted_onset._unit = 'hours';
                }
              }

              if (_.has(drug.properties, 'after-effects')) {
                const roas = drug.properties['after-effects'].split('|');
                drug.formatted_aftereffects = {};
                if (roas.length > 1 || roas[0].match(':')) {
                  _.each(roas, roa => {
                    if (roa.toLowerCase().match('note')) {
                      return;
                    }
                    const match = roa.match(/([\w/]+):?\s([.\w\d-+]+)/i);
                    if (match) {
                      drug.formatted_aftereffects[match[1]] = match[2];
                    }
                  });
                } else {
                  const match = drug.properties['after-effects'].match(/([.\w\d-+]+)/i);
                  drug.formatted_aftereffects = { value: match[1] };
                }
                if (drug.properties['after-effects'].indexOf('minutes') !== -1) {
                  drug.formatted_aftereffects._unit = 'minutes';
                }
                if (drug.properties['after-effects'].indexOf('hours') !== -1) {
                  drug.formatted_aftereffects._unit = 'hours';
                }
              }
              if (!_.has(drug, 'pretty_name')) {
                drug.pretty_name = drug.name;
                if (drug.name.length <= 4 || drug.name.indexOf('-') !== -1) {
                  drug.pretty_name = drug.name.toUpperCase();
                } else {
                  drug.pretty_name = drug.name.charAt(0).toUpperCase() + drug.name.slice(1);
                }
                drug.pretty_name = drug.pretty_name.replace(/MEO/, 'MeO');
                drug.pretty_name = drug.pretty_name.replace(/ACO/, 'AcO');
                drug.pretty_name = drug.pretty_name.replace(/NBOME/, 'NBOMe');
                drug.pretty_name = drug.pretty_name.replace(/MIPT/, 'MiPT');
                drug.pretty_name = drug.pretty_name.replace(/DIPT/, 'DiPT');
              }
            }

            if (drug) {
              return drug;
            }
            return { err: true, msg: 'No drug found.' };
          });
        } else {
          if (drug) {
            // log.debug(F, `${name} found on first pass, formatting now!`);
            if (!_.isUndefined(drug.aliases)) drug.properties.aliases = drug.aliases;
            if (!_.isUndefined(drug.categories)) drug.properties.categories = drug.categories;

            if (_.has(comboData, drug.name)) {
              drug.combos = comboData[drug.name];
            }

            if (_.has(drug.properties, 'dose')) {
              const doses = drug.properties.dose.split('|');
              const regex = /(([\w-]+):\s([/.\w\d-+µ]+))/ig;
              drug.formatted_dose = {};
              if (doses.length > 1 || !doses[0].split(' ')[0].match(':')) {
                _.each(doses, dString => {
                  dString = dString.replace(/\s\s+/g, ' ');
                  const roa = dString.trim().split(' ')[0];
                  let match = regex.exec(dString);
                  if (roa.match(/note/i)) {
                    drug.dose_note = dString;
                  } else {
                    drug.formatted_dose[roa] = {};
                    while (match !== null) {
                      drug.formatted_dose[roa][match[2]] = match[3];
                      match = regex.exec(dString);
                    }
                  }
                });
              } else {
                const roa = 'Oral';
                let match = regex.exec(doses[0]);
                if (roa.match(/note/i)) {
                  drug.dose_note = doses[0];
                } else {
                  drug.formatted_dose[roa] = {};
                  while (match !== null) {
                    drug.formatted_dose[roa][match[2]] = match[3];
                    match = regex.exec(doses[0]);
                  }
                }
              }
            }
            // log.debug(F, 'dose finished');

            if (_.has(drug.properties, 'effects')) {
              drug.formatted_effects = _.collect(drug.properties.effects.split(/[.,]+/), item => item.trim());
            }
            // log.debug(F, 'effects finished');

            if (_.has(drug.properties, 'duration')) {
              const roas = drug.properties.duration.split('|');
              drug.formatted_duration = {};
              if (roas.length > 1 || roas[0].match(':')) {
                _.each(roas, roa => {
                  if (roa.toLowerCase().match('note')) {
                    return;
                  }
                  const match = roa.match(/([\w-/]+):?\s([.\w\d-+]+)/i);
                  if (match) {
                    drug.formatted_duration[match[1]] = match[2];
                  }
                });
              } else {
                const match = drug.properties.duration.match(/([.\w\d-+]+)/i);
                drug.formatted_duration = { value: match[1] };
              }
              if (drug.properties.duration.indexOf('minutes') !== -1) {
                drug.formatted_duration._unit = 'minutes';
              }
              if (drug.properties.duration.indexOf('hours') !== -1) {
                drug.formatted_duration._unit = 'hours';
              }
            }
            // log.debug(F, 'duration finished');

            if (_.has(drug.properties, 'onset')) {
              const roas = drug.properties.onset.split('|');
              drug.formatted_onset = {};
              if (roas.length > 1 || roas[0].match(':')) {
                _.each(roas, roa => {
                  if (roa.toLowerCase().match('note')) {
                    return;
                  }
                  const match = roa.match(/([/\w-]+):??\s([.\w\d-+]+)/i);
                  if (match) {
                    drug.formatted_onset[match[1]] = match[2];
                  }
                });
              } else {
                const match = drug.properties.onset.match(/([.\w\d-+]+)/i);
                drug.formatted_onset = { value: match[1] };
              }
              if (drug.properties.onset.indexOf('minutes') !== -1) {
                drug.formatted_onset._unit = 'minutes';
              }
              if (drug.properties.onset.indexOf('hours') !== -1) {
                drug.formatted_onset._unit = 'hours';
              }
            }
            // log.debug(F, 'onset finished');

            if (_.has(drug.properties, 'after-effects')) {
              const roas = drug.properties['after-effects'].split('|');
              drug.formatted_aftereffects = {};
              if (roas.length > 1 || roas[0].match(':')) {
                _.each(roas, roa => {
                  if (roa.toLowerCase().match('note')) {
                    return;
                  }
                  const match = roa.match(/([\w/]+):?\s([.\w\d-+]+)/i);
                  if (match) {
                    drug.formatted_aftereffects[match[1]] = match[2];
                  }
                });
              } else {
                const match = drug.properties['after-effects'].match(/([.\w\d-+]+)/i);
                drug.formatted_aftereffects = { value: match[1] };
              }
              if (drug.properties['after-effects'].indexOf('minutes') !== -1) {
                drug.formatted_aftereffects._unit = 'minutes';
              }
              if (drug.properties['after-effects'].indexOf('hours') !== -1) {
                drug.formatted_aftereffects._unit = 'hours';
              }
            }
            // log.debug(F, 'after finished');

            if (!_.has(drug, 'pretty_name')) {
              drug.pretty_name = drug.name;
              if (drug.name.length <= 4 || drug.name.indexOf('-') !== -1) {
                drug.pretty_name = drug.name.toUpperCase();
              } else {
                drug.pretty_name = drug.name.charAt(0).toUpperCase() + drug.name.slice(1);
              }
              drug.pretty_name = drug.pretty_name.replace(/MEO/, 'MeO');
              drug.pretty_name = drug.pretty_name.replace(/ACO/, 'AcO');
              drug.pretty_name = drug.pretty_name.replace(/NBOME/, 'NBOMe');
              drug.pretty_name = drug.pretty_name.replace(/MIPT/, 'MiPT');
              drug.pretty_name = drug.pretty_name.replace(/DIPT/, 'DiPT');
            }
            // log.debug(F, 'pretty_name finished');
          }
          if (drug) {
            // log.debug(F, `${name} has data, returning now!`);
            resolve(drug);
          } else {
            // log.debug(F, `${name} did not find anything, returning now!`);
            resolve({ err: true, msg: 'No drug found.' });
          }
        }
        resolve({ err: true, msg: 'No drug found.' });
      });
    });
  },

  async getAllDrugNames():Promise<any> {
    return new Promise(resolve => {
      // log.debug(F, 'getAllDrugNames');
      const names = [];
      db.scan('drugs', drug => {
        if (drug) {
          names.push(drug.name);
        }
      }, () => resolve(names));
    });
  },

  async getAllDrugNamesByCategory(category:string):Promise<any> {
    return new Promise(async resolve => {
      // log.debug(F, `getAllDrugNamesByCategory | Category: ${category}`);
      resolve(await this.getAllDrugs(names => _.pluck(_.filter(names, a => _.include(a.categories, category)), 'name')));
    });
  },

  async getAllDrugs():Promise<any> {
    return new Promise(async resolve => {
      // log.debug(F, 'getAllDrugs');
      const names = await this.getAllDrugNames();
      const drugs = {};
      for (const name of names) {
        if (!_.isUndefined(name)) {
          const drug = await this.getDrug(name);
          drugs[name] = drug;
        }
      }
      resolve(drugs);
    });
  },

  async getAllCategories():Promise<any> {
    return new Promise(resolve => {
      // log.debug(F, 'getAllCategories');
      const categories = {};
      db.scan('drug_categories', cat => {
        // console.log(`cat: ${JSON.stringify(cat)}`);
        categories[cat.name] = cat;
      }, () => resolve(categories));
    });
  },

  async getAllDrugAliases():Promise<any> {
    return new Promise(async resolve => {
      // log.debug(F, 'getAllDrugAliases');
      const names = await this.getAllDrugNames();
      let fullNames = [];
      for (const name of names) {
        if (!_.isUndefined(name)) {
          const drug = await this.getDrug(name);
          fullNames.push(name);
          fullNames = _.union(fullNames, drug.aliases);
        }
      }
      resolve(fullNames);
    });
  },
};
