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

  const drugAData = drugDataAll.find(drug => drug.name.toLowerCase() === drugA.toLowerCase());
  const drugBData = drugDataAll.find(drug => drug.name.toLowerCase() === drugB.toLowerCase());

  // log.debug(F, `drugData: ${JSON.stringify(drugData, null, 2)}`);

  if (!drugAData) {
    return {
      success: false,
      title: `${drugA} was not found`,
      description: devMsg,
    };
  }

  if (!drugBData) {
    return {
      success: false,
      title: `${drugB} was not found`,
      description: devMsg,
    };
  }

  if (!drugAData.interactions) {
    return {
      success: true,
      title: `Could not find interaction info for ${drugA}!`,
      description: stripIndents`[Check out the wiki page](${drugAData.url})`,
    };
  }

  if (!drugBData.interactions) {
    return {
      success: true,
      title: `Could not find interaction info for ${drugB}!`,
      description: stripIndents`[Check out the wiki page](${drugBData.url})`,
    };
  }

  // log.debug(F, `interactions: ${drugAData.interactions.length}`);

  const drugInteraction = drugAData.interactions.find(
    interaction => interaction.name.toLowerCase() === drugB.toLowerCase(),
  );

  if (!drugInteraction) {
    return {
      success: true,
      title: `Could not find interaction info for ${drugA} and ${drugB}!`,
      description: `This does not mean combining them is safe!\nThis means we don't have information on it!

      Start your research here:
      [${drugA}](${drugAData.url})
      [${drugB}](${drugBData.url})
      `,
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
