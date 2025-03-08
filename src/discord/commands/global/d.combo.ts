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
    const ephemeral: boolean = (interaction.options.getBoolean('ephemeral') === true);
    await interaction.deferReply({ ephemeral });
    const drugA = interaction.options.getString('first_drug', true);
    const drugB = interaction.options.getString('second_drug', true);

    const results = await combo(drugA, drugB);
    // log.debug(F, `${JSON.stringify(results, null, 2)}`);

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
        await interaction.editReply(stripIndents`I could not find interactions between ${drugA} and ${drugB} in the database!

        This does not mean combining them is safe: this means we don't have information on it!`);
        return false;
      }

      if (errorResults.msg.includes('are the same')) {
        await interaction.editReply({
          embeds: [embedTemplate()
            .setDescription(`${errorResults.msg}`)
            .setFields([
              {
                name: `${drugA}`,
                value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugA})
              * [TripSit Factsheets](https://drugs.tripsit.me/${drugA})
              * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugA})
              * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugA}.shtml)`,
                inline: true,
              },
              {
                name: `${drugB}`,
                value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugB})
              * [TripSit Factsheets](https://drugs.tripsit.me/${drugB})
              * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugB})
              * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugB}.shtml)`,
                inline: true,
              },
            ])],
        });
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
      sources?: {
        author: string;
        url: string;
        title: string;
      }[];
    };

    const noteString = resultsData.note ? `\n\n**Note: ${resultsData.note}**` : '';

    const embed = embedTemplate()
      .setTitle(`Mixing ${drugA} and ${drugB}: ${resultsData.emoji} ${resultsData.result} ${resultsData.emoji}`)
      .setDescription(`${resultsData.definition}${noteString}`);

    if (resultsData.sources) {
      // const sourceArray = resultsData.sources.map(source => `* [${source.title}](${source.url})\n`);

      const experiences = [] as string[];
      const journals = [] as string[];

      resultsData.sources.forEach(source => {
        if (source.url.includes('erowid.org/experiences')) {
          experiences.push(`* [${source.title}](${source.url})\n`);
        } else {
          journals.push(`* [${source.title}](${source.url})\n`);
        }
      });

      // log.debug(F, `Experiences: ${experiences}`);
      // log.debug(F, `Journals: ${journals}`);

      if (journals.length > 0) {
        embed.addFields({
          name: '⚗️ Research Articles',
          value: journals.join(''),
          inline: false,
        });
      }

      if (experiences.length > 0) {
        embed.addFields({
          name: `<:erowidLogo:${env.EMOJI_EROWID}> Erowid Experiences`,
          value: experiences.join(''),
          inline: false,
        });
      }
    }
    embed.addFields(
      {
        name: `${drugA}`,
        value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugA})
          * [TripSit Factsheets](https://drugs.tripsit.me/${drugA})
          * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugA})
          * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugA}.shtml)`,
        inline: true,
      },
      {
        name: `${drugB}`,
        value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugB})
          * [TripSit Factsheets](https://drugs.tripsit.me/${drugB})
          * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugB})
          * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugB}.shtml)`,
        inline: true,
      },
    );

    if (resultsData.thumbnail) embed.setThumbnail(resultsData.thumbnail);
    if (resultsData.color) embed.setColor(Colors[resultsData.color as keyof typeof Colors]);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dCombo;
