import { parse } from 'path';
import { stripIndents } from 'common-tags';

import drugDataAll from '../assets/data/drug_db_combined.json';
import comboDefs from '../assets/data/combo_definitions.json';

const F = f(__filename);

const devMsg = '...this shouldn\'t have happened, please tell the developer!';

export default combo;

/**
 * combo data
 * @param {string} drugA
 * @param {string} drugB
 * @return {{
 *     success: boolean,
 *     title: string,
 *     description: string,
 *   }}
 */
export async function combo(
  drugA: string,
  drugB: string,
): Promise<{
    success: boolean,
    title: string,
    description: string,
    thumbnail?: string,
    color?: string,
  }> {
  if (drugDataAll === null || drugDataAll === undefined) {
    return {
      success: false,
      title: 'Drug data was not found',
      description: devMsg,
    };
  }

  const drugData = drugDataAll.find(drug => drug.name === drugA);

  // log.debug(F, `drugData: ${JSON.stringify(drugData, null, 2)}`);

  if (!drugData) {
    return {
      success: false,
      title: `${drugA} was not found`,
      description: devMsg,
    };
  }

  if (!drugData.interactions) {
    return {
      success: true,
      title: `${drugA} has no known interactions!`,
      description: stripIndents`This does not mean combining this with anything is safe!
      This means we don't have information on it!`,
    };
  }

  // log.debug(F, `interactions: ${drugData.interactions.length}`);

  const drugInteraction = drugData.interactions.find(interaction => interaction.name === drugB);

  if (!drugInteraction) {
    return {
      success: true,
      title: `${drugA} and ${drugB} have no known interactions!`,
      description: 'This does not mean combining them is safe!\nThis means we don\'t have information on it!',
    };
  }

  // log.debug(F, `drugInteraction: ${drugInteraction}`);

  const intDef = comboDefs.find(def => def.status === drugInteraction.status);

  // log.debug(F, `intDef: ${JSON.stringify(intDef)}`);

  if (!intDef) {
    return {
      success: false,
      title: `${drugA} and ${drugB} have an unknown interaction!`,
      description: devMsg,
    };
  }

  const {
    status,
    color,
    emoji,
    definition,
    thumbnail,
  } = intDef;
  const output = `${emoji} ${status} ${emoji}`;

  const response = {
    success: true,
    title: `Mixing **${drugA}** and **${drugB}**: ${output}`,
    description: definition,
    thumbnail,
    color,
  };

  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

  return response;
}
