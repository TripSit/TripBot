import { stripIndents } from 'common-tags';
import { CbSubstance, Interaction } from '../@types/combined.d';
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
  let drugAData = (drugDataAll as CbSubstance[]).find(drug => drug.name.toLowerCase() === drugA.toLowerCase());
  if (!drugAData) {
    drugAData = (drugDataAll as CbSubstance[]).find(
      drug => drug.aliases?.map(c => c.toLowerCase()).includes(drugA.toLowerCase()),
    );
    if (!drugAData) {
      return {
        success: false,
        title: `${drugA} was not found, make sure you spelled it correctly!`,
        description: devMsg,
      };
    }
  }

  let drugBData = (drugDataAll as CbSubstance[]).find(drug => drug.name.toLowerCase() === drugB.toLowerCase());
  if (!drugBData) {
    drugBData = (drugDataAll as CbSubstance[]).find(
      drug => drug.aliases?.map(c => c.toLowerCase()).includes(drugB.toLowerCase()),
    );
    if (!drugBData) {
      return {
        success: false,
        title: `${drugB} was not found, make sure you spelled it correctly!`,
        description: devMsg,
      };
    }
  }

  // type Interaction = {
  //   status: string;
  //   note?: string;
  //   name: string;
  // };

  let drugInteraction = {} as Interaction | undefined;

  if (drugAData.interactions) {
    // log.debug(F, `${drugA} has interactions`);
    // Match based on name
    drugInteraction = drugAData.interactions.find(
      interaction => interaction.name.toLowerCase().includes(drugB.toLowerCase()),
    );

    if (!drugInteraction && drugBData.classes?.chemical) {
      // log.debug(F, `${drugA} Interaction not found, checking chemical classes in ${drugB}`);

      // If the interaction is not found by matching the name, try matching on the class
      const drugBChemClassList = drugBData.classes?.chemical?.map(c => c.toLowerCase());
      // log.debug(F, `drugBChemClassList: ${drugBChemClassList}`);

      drugInteraction = drugAData.interactions.find(
        interaction => drugBChemClassList.includes(interaction.name.toLowerCase()),
      );

      // log.debug(F, `drugInteractionCheck: ${JSON.stringify(drugInteraction, null, 2)}`);

      if (!drugInteraction) {
        // log.debug(F, `${drugA} Interaction not found, checking classes, removing s from end of class name`);
        drugInteraction = drugAData.interactions.find(
          interaction => drugBChemClassList.includes(interaction.name.slice(0, -1).toLowerCase()),
        );
      }
    }

    if (!drugInteraction && drugBData.classes?.psychoactive) {
      // log.debug(F, `${drugA} Interaction not found, checking psychoactive classes`);

      // If the interaction is not found by matching the name, try matching on the class
      const drugBPsychClassList = drugBData.classes?.psychoactive?.map(c => c.toLowerCase());
      // log.debug(F, `drugBPsychClassList: ${drugBPsychClassList}`);

      drugInteraction = drugAData.interactions.find(
        interaction => drugBPsychClassList.includes(interaction.name.toLowerCase()),
      );
    }
  } else if (drugBData.interactions) {
    // log.debug(F, `${drugB} has interactions}`);
    drugInteraction = drugBData.interactions.find(
      interaction => interaction.name.toLowerCase().includes(drugA.toLowerCase()),
    );

    if (!drugInteraction && drugAData.classes?.chemical) {
      // log.debug(F, `${drugB} Interaction not found, checking chemical classes in ${drugA}`);
      // If the interaction is not found by matching the name, try matching on the class
      const drugAChemClassList = drugAData.classes?.chemical?.map(c => c.toLowerCase());
      // log.debug(F, `drugAClassList: ${drugAChemClassList}`);

      drugInteraction = drugBData.interactions.find(
        interaction => drugAChemClassList.includes(interaction.name.toLowerCase()),
      );

      if (!drugInteraction) {
        // log.debug(F, `${drugB} Interaction not found, checking classes, removing s from end of class name`);
        drugInteraction = drugBData.interactions.find(
          interaction => drugAChemClassList.includes(interaction.name.slice(0, -1).toLowerCase()),
        );
      }
    }

    if (!drugInteraction && drugAData.classes?.psychoactive) {
      // log.debug(F, `${drugB} Interaction not found, checking psychoactive classes`);
      // If the interaction is not found by matching the name, try matching on the class
      const drugAPsychClassList = drugAData.classes?.psychoactive?.map(c => c.toLowerCase());
      // log.debug(F, `drugAPsychClassList: ${drugAPsychClassList}`);

      drugInteraction = drugBData.interactions.find(
        interaction => drugAPsychClassList.includes(interaction.name.toLowerCase()),
      );
    }
  }

  if (!drugInteraction || !drugInteraction.status) {
    return {
      success: true,
      title: `Could not find interaction info for ${drugA} and ${drugB}!`,
      description: stripIndents`This does not mean combining them is safe!\nThis means we don't have information on it!

      Start your research here:
      [${drugA}](${drugAData.url})
      [${drugB}](${drugBData.url})`,
    };
  }

  type ComboDef = {
    status: string;
    emoji: string;
    color: string;
    definition: string;
    thumbnail: string;
  };

  const intDef = comboDefs.find(def => def.status === drugInteraction?.status) as ComboDef;

  // log.debug(F, `intDef: ${JSON.stringify(intDef)}`);

  // if (!intDef) {
  //   return {
  //     success: false,
  //     title: `${drugA} and ${drugB} have an unknown interaction!`,
  //     description: devMsg,
  //   };
  // }

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
    title: `Mixing ${drugA} and ${drugB}: ${output}`,
    description: definition,
    thumbnail,
    color,
  };

  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

  return response;
}
