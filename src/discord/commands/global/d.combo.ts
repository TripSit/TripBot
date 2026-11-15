import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  Colors,
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { combo } from '../../../global/commands/g.combo';
import commandContext from '../../utils/context';

const F = f(__filename);

type ComboSuccess = Exclude<Awaited<ReturnType<typeof combo>>, { err: boolean }>;

const drugLinksField = (drug: string) => ({
  name: `${drug}`,
  value: stripIndents`* [TripSit Wiki](https://wiki.tripsit.me/wiki/${drug})
    * [TripSit Factsheets](https://drugs.tripsit.me/${drug})
    * [PsychonautWiki](https://psychonautwiki.org/wiki/${drug})
    * [Erowid Experiences](https://www.erowid.org/experiences/subs/exp_${drug}.shtml)`,
  inline: true,
});

async function replyWithComboError(
  interaction: ChatInputCommandInteraction,
  message: string,
  drugA: string,
  drugB: string,
): Promise<void> {
  if (message.includes('not found')) {
    await interaction.editReply(stripIndents`I could not find interactions between ${drugA} and ${drugB} in the database!

        This does not mean combining them is safe: this means we don't have information on it!`);
    return;
  }

  if (message.includes('are the same')) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setDescription(`${message}`)
        .setFields([drugLinksField(drugA), drugLinksField(drugB)])],
    });
    return;
  }

  // Use regex to check if there are any URLS in the error message, and if so, wrap them in <  and >
  const regex = /(https?:\/\/[^\s]+)/g;
  let wrapped = message;
  (message.match(regex) ?? []).forEach(match => {
    wrapped = wrapped.replace(match, `<${match}>`);
  });
  await interaction.editReply(wrapped);
}

function addSourceFields(embed: EmbedBuilder, sources: NonNullable<ComboSuccess['sources']>): void {
  const experiences = [] as string[];
  const journals = [] as string[];

  sources.forEach(source => {
    if (source.url.includes('erowid.org/experiences')) {
      experiences.push(`* [${source.title}](${source.url})\n`);
    } else {
      journals.push(`* [${source.title}](${source.url})\n`);
    }
  });

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

export const dCombo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combo')
    .setDescription('Check combo information')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addStringOption(option => option.setName('first_drug')
      .setDescription('Pick the first drug')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('second_drug')
      .setDescription('Pick the second drug')
      .setRequired(true)
      .setAutocomplete(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const drugA = interaction.options.getString('first_drug', true);
    const drugB = interaction.options.getString('second_drug', true);

    const results = await combo(drugA, drugB);

    if ('err' in results && results.err) {
      await replyWithComboError(interaction, results.msg, drugA, drugB);
      return false;
    }

    const resultsData = results as ComboSuccess;

    const noteString = resultsData.note ? `\n\n**Note: ${resultsData.note}**` : '';

    const embed = embedTemplate()
      .setTitle(`Mixing ${drugA} and ${drugB}: ${resultsData.emoji} ${resultsData.result} ${resultsData.emoji}`)
      .setDescription(`${resultsData.definition}${noteString}`);

    if (resultsData.sources) {
      addSourceFields(embed, resultsData.sources);
    }
    embed.addFields(drugLinksField(drugA), drugLinksField(drugB));

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
