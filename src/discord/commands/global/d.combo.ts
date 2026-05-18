import {
  SlashCommandBuilder,
  Colors,
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { combo } from '../../../global/commands/g.combo';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dCombo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combo')
    .setNameLocalizations(getCommandLocalizations('combo', 'commandName'))
    .setDescription('Check combo information')
    .setDescriptionLocalizations(getCommandLocalizations('combo', 'commandDescription'))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addStringOption(option => option.setName('first_drug')
      .setDescription(t('en', 'combo', 'firstDrugOption'))
      .setDescriptionLocalizations(getCommandLocalizations('combo', 'firstDrugOption'))
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('second_drug')
      .setDescription(t('en', 'combo', 'secondDrugOption'))
      .setDescriptionLocalizations(getCommandLocalizations('combo', 'secondDrugOption'))
      .setRequired(true)
      .setAutocomplete(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'combo', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('combo', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'combo');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
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
        await interaction.editReply(t(locale, 'combo', 'notFound', { drugA, drugB }));
        return false;
      }

      if (errorResults.msg.includes('are the same')) {
        await interaction.editReply({
          embeds: [embedTemplate()
            .setDescription(`${errorResults.msg}`)
            .setFields([
              {
                name: `${drugA}`,
                value: stripIndents`* [${t(locale, 'combo', 'wikiLink')}](https://wiki.tripsit.me/wiki/${drugA})
              * [${t(locale, 'combo', 'factsheetsLink')}](https://drugs.tripsit.me/${drugA})
              * [${t(locale, 'combo', 'psychonautLink')}](https://psychonautwiki.org/wiki/${drugA})
              * [${t(locale, 'combo', 'erowiadExperiencesLink')}](https://www.erowid.org/experiences/subs/exp_${drugA}.shtml)`,
                inline: true,
              },
              {
                name: `${drugB}`,
                value: stripIndents`* [${t(locale, 'combo', 'wikiLink')}](https://wiki.tripsit.me/wiki/${drugB})
              * [${t(locale, 'combo', 'factsheetsLink')}](https://drugs.tripsit.me/${drugB})
              * [${t(locale, 'combo', 'psychonautLink')}](https://psychonautwiki.org/wiki/${drugB})
              * [${t(locale, 'combo', 'erowiadExperiencesLink')}](https://www.erowid.org/experiences/subs/exp_${drugB}.shtml)`,
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

    const noteString = resultsData.note ? `\n\n**${t(locale, 'combo', 'note', { note: resultsData.note })}**` : '';

    const embed = embedTemplate()
      .setTitle(t(locale, 'combo', 'embeddedTitle', {
        drugA, drugB, emoji: resultsData.emoji, result: resultsData.result,
      }))
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
          name: t(locale, 'combo', 'researchArticles'),
          value: journals.join(''),
          inline: false,
        });
      }

      if (experiences.length > 0) {
        embed.addFields({
          name: t(locale, 'combo', 'erowid', { emojiId: env.EMOJI_EROWID }),
          value: experiences.join(''),
          inline: false,
        });
      }
    }
    embed.addFields(
      {
        name: `${drugA}`,
        value: stripIndents`* [${t(locale, 'combo', 'wikiLink')}](https://wiki.tripsit.me/wiki/${drugA})
          * [${t(locale, 'combo', 'factsheetsLink')}](https://drugs.tripsit.me/${drugA})
          * [${t(locale, 'combo', 'psychonautLink')}](https://psychonautwiki.org/wiki/${drugA})
          * [${t(locale, 'combo', 'erowiadExperiencesLink')}](https://www.erowid.org/experiences/subs/exp_${drugA}.shtml)`,
        inline: true,
      },
      {
        name: `${drugB}`,
        value: stripIndents`* [${t(locale, 'combo', 'wikiLink')}](https://wiki.tripsit.me/wiki/${drugB})
          * [${t(locale, 'combo', 'factsheetsLink')}](https://drugs.tripsit.me/${drugB})
          * [${t(locale, 'combo', 'psychonautLink')}](https://psychonautwiki.org/wiki/${drugB})
          * [${t(locale, 'combo', 'erowiadExperiencesLink')}](https://www.erowid.org/experiences/subs/exp_${drugB}.shtml)`,
        inline: true,
      },
    );

    if (resultsData.thumbnail) embed.setThumbnail(resultsData.thumbnail);
    if (resultsData.color) embed.setColor(Colors[resultsData.color as keyof typeof Colors]);
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
