import { stripIndents } from 'common-tags';
import { Colors, MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { combo } from '../../../global/commands/g.combo';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dCombo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combo')
    .setDescription('Check combo information')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addStringOption((option) =>
      option
        .setName('first_drug')
        .setDescription('Pick the first drug')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('second_drug')
        .setDescription('Pick the second drug')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const drugA = interaction.options.getString('first_drug', true);
    const drugB = interaction.options.getString('second_drug', true);

    const results = await combo(drugA, drugB);
    // log.debug(F, `${JSON.stringify(results, null, 2)}`);

    if (
      (
        results as {
          err: boolean;
          msg: string;
          options?: string[];
        }
      ).err
    ) {
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
          embeds: [
            embedTemplate()
              .setDescription(errorResults.msg)
              .setFields([
                {
                  inline: true,
                  name: drugA,
                  value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugA})
              * [TripSit Factsheets](https://drugs.tripsit.me/${drugA})
              * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugA})
              * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugA}.shtml)`,
                },
                {
                  inline: true,
                  name: drugB,
                  value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugB})
              * [TripSit Factsheets](https://drugs.tripsit.me/${drugB})
              * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugB})
              * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugB}.shtml)`,
                },
              ]),
          ],
        });
        return false;
      }

      // Use regex to check if there are any URLS in the error message, and if so, wrap them in <  and >
      const regex = /(https?:\/\/[^\s]+)/g;
      const matches = errorResults.msg.match(regex);
      if (matches) {
        for (const match of matches) {
          errorResults.msg = errorResults.msg.replace(match, `<${match}>`);
        }
      }
      await interaction.editReply(errorResults.msg);
      return false;
    }

    const resultsData = results as {
      color: string;
      definition: string;
      emoji: string;
      interactionCategoryA: string;
      interactionCategoryB: string;
      note?: string;
      result: string;
      sources?: {
        author: string;
        title: string;
        url: string;
      }[];
      thumbnail: string;
    };

    const noteString = resultsData.note ? `\n\n**Note: ${resultsData.note}**` : '';

    const embed = embedTemplate()
      .setTitle(
        `Mixing ${drugA} and ${drugB}: ${resultsData.emoji} ${resultsData.result} ${resultsData.emoji}`,
      )
      .setDescription(`${resultsData.definition}${noteString}`);

    if (resultsData.sources) {
      // const sourceArray = resultsData.sources.map(source => `* [${source.title}](${source.url})\n`);

      const experiences = [] as string[];
      const journals = [] as string[];

      for (const source of resultsData.sources) {
        if (source.url.includes('erowid.org/experiences')) {
          experiences.push(`* [${source.title}](${source.url})\n`);
        } else {
          journals.push(`* [${source.title}](${source.url})\n`);
        }
      }

      // log.debug(F, `Experiences: ${experiences}`);
      // log.debug(F, `Journals: ${journals}`);

      if (journals.length > 0) {
        embed.addFields({
          inline: false,
          name: '⚗️ Research Articles',
          value: journals.join(''),
        });
      }

      if (experiences.length > 0) {
        embed.addFields({
          inline: false,
          name: `<:erowidLogo:${env.EMOJI_EROWID}> Erowid Experiences`,
          value: experiences.join(''),
        });
      }
    }
    embed.addFields(
      {
        inline: true,
        name: drugA,
        value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugA})
          * [TripSit Factsheets](https://drugs.tripsit.me/${drugA})
          * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugA})
          * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugA}.shtml)`,
      },
      {
        inline: true,
        name: drugB,
        value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drugB})
          * [TripSit Factsheets](https://drugs.tripsit.me/${drugB})
          * [PsychonautWiki](https://psychonautwiki.org/wiki/${drugB})
          * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drugB}.shtml)`,
      },
    );

    if (resultsData.thumbnail) {
      embed.setThumbnail(resultsData.thumbnail);
    }
    if (resultsData.color) {
      embed.setColor(Colors[resultsData.color as keyof typeof Colors]);
    }
    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    return true;
  },
};

export default dCombo;
