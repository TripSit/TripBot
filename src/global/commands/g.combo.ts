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
      title: `${drugA} was not found, make sure you spelled it correctly`,
      description: devMsg,
    };
  }

  if (!drugBData) {
    return {
      success: false,
      title: `${drugB} was not found, make sure you spelled it correctly!`,
      description: devMsg,
    };
  }

  let drugInteraction = {} as any;

  if (drugAData.interactions) {
    // Match based on name
    drugInteraction = drugAData.interactions.find(
      interaction => interaction.name.toLowerCase() === drugB.toLowerCase(),
    );

    if (!drugInteraction && drugBData.classes?.chemical) {
      // If the interaction is not found by matching the name, try matching on the class
      const drugBClassList = drugBData.classes?.chemical?.map(c => c.toLowerCase());
      log.debug(F, `drugBClassList: ${drugBClassList}`);

      drugInteraction = drugAData.interactions.find(
        interaction => drugBClassList.includes(interaction.name.toLowerCase()),
      );
    }

    if (!drugInteraction && drugBData.classes?.psychoactive) {
      // If the interaction is not found by matching the name, try matching on the class
      const drugBClassList = drugBData.classes?.psychoactive?.map(c => c.toLowerCase());
      log.debug(F, `drugBClassList: ${drugBClassList}`);

      drugInteraction = drugAData.interactions.find(
        interaction => drugBClassList.includes(interaction.name.toLowerCase()),
      );
    }
  } else if (drugBData.interactions) {
    drugInteraction = drugBData.interactions.find(
      interaction => interaction.name.toLowerCase() === drugA.toLowerCase(),
    );

    if (!drugInteraction && drugAData.classes?.chemical) {
      // If the interaction is not found by matching the name, try matching on the class
      const drugAClassList = drugAData.classes?.chemical?.map(c => c.toLowerCase());
      log.debug(F, `drugAClassList: ${drugAClassList}`);

      drugInteraction = drugBData.interactions.find(
        interaction => drugAClassList.includes(interaction.name.toLowerCase()),
      );
    }

    if (!drugInteraction && drugBData.classes?.psychoactive) {
      // If the interaction is not found by matching the name, try matching on the class
      const drugAClassList = drugBData.classes?.psychoactive?.map(c => c.toLowerCase());
      log.debug(F, `drugAClassList: ${drugAClassList}`);

      drugInteraction = drugBData.interactions.find(
        interaction => drugAClassList.includes(interaction.name.toLowerCase()),
      );
    }
  }

  if (!drugInteraction.status) {
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

  const intDef = comboDefs.find(def => def.status === drugInteraction?.status);

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
