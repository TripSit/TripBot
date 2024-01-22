import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { combo } from '../../../global/commands/g.combo';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dCombo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combo')
    .setDescription('Check combo information')
    .addStringOption(option => option.setName('first_drug')
      .setDescription('Pick the first drug')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('second_drug')
      .setDescription('Pick the second drug')
      .setRequired(true)
      .setAutocomplete(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);
    await interaction.deferReply({ ephemeral });
    const drugA = interaction.options.getString('first_drug', true);
    const drugB = interaction.options.getString('second_drug', true);

    const results = await combo(drugA, drugB);

    if ((results as {
      err: boolean;
      msg: string;
      options?: string[];
    }).err) {
      const errorResults = results as {
        err: boolean;
        msg: string;
        options?: string[];
      };
      if (errorResults.msg.includes('not found')) {
        await interaction.editReply(stripIndents`${drugA} and ${drugB} have no known interactions or we could not find them in the database!

        This does not mean combining them is safe: this means we don't have information on it!`);
        return false;
      }

      // Use regex to check if there are any URLS in the error message, and if so, wrap them in <  and >
      const regex = /(https?:\/\/[^\s]+)/g;
      const matches = errorResults.msg.match(regex);
      if (matches) {
        matches.forEach(match => {
          errorResults.msg = errorResults.msg.replace(match, `<${match}>`);
        });
      }
      await interaction.editReply(errorResults.msg);
      return false;
    }

    const resultsData = results as {
      result: string;
      definition: string;
      thumbnail: string;
      color: string;
      emoji: string;
      interactionCategoryA: string;
      interactionCategoryB: string;
      note?: string;
      sources?: string[];
    };

    const noteString = resultsData.note ? `\n\nNote: ${resultsData.note}` : '';

    let sourceString = '' as string;
    if (resultsData.sources) {
      const sourceArray = resultsData.sources.map(url => {
        // Make a markdown URL that uses the domain as the text
        const urlObj = new URL(url);
        return `[${urlObj.hostname}](${url})`;
      });
      sourceString = `\n\nSources: ${sourceArray.join(', ')}`;
    }

    const linkString = stripIndents`
    
    Check the following resources for more information:
    
    **${drugA}**
    * [TripSit Wiki - ${drugA}](https://wiki.tripsit.me/wiki/${drugA})
    * [TripSit Factsheets - ${drugA}](https://drugs.tripsit.me/${drugA})
    * [PsychonautWiki - ${drugA}](https://psychonautwiki.org/wiki/${drugA})

    **${drugB}**
    * [TripSit Wiki - ${drugB}](https://wiki.tripsit.me/wiki/${drugB})
    * [TripSit Factsheets - ${drugB}](https://drugs.tripsit.me/${drugB})
    * [PsychonautWiki - ${drugB}](https://psychonautwiki.org/wiki/${drugB})`;

    const embed = embedTemplate()
      .setTitle(`Mixing ${drugA} and ${drugB}: ${resultsData.emoji} ${resultsData.result} ${resultsData.emoji}`)
      .setDescription(`${resultsData.definition}${noteString}${sourceString}
      
      ${linkString}`);
    if (resultsData.thumbnail) embed.setThumbnail(resultsData.thumbnail);
    if (resultsData.color) embed.setColor(Colors[resultsData.color as keyof typeof Colors]);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dCombo;
