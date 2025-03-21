import {
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  Message,
  ButtonInteraction,
} from 'discord.js';
import {
  ButtonStyle,
  MessageFlags,
} from 'discord-api-types/v10';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

export default paginationEmbed;

const previousButton = new ButtonBuilder()
  .setCustomId('previousButton')
  .setLabel('Previous')
  .setStyle(ButtonStyle.Danger);

const nextButton = new ButtonBuilder()
  .setCustomId('nextButton')
  .setLabel('Next')
  .setStyle(ButtonStyle.Success);

const buttonList = [
  previousButton,
  nextButton,
];

/**
 * Creates a pagination embed
 * @param {BaseCommandInteraction} interaction The interaction to paginate
 * @param {EmbedBuilder[]} pages The pages to paginate
 * @param {number} timeout The timeout in milliseconds to wait for reactions
 * @return {Promise<void>}
 */
export async function paginationEmbed(
  interaction:CommandInteraction,
  pages:EmbedBuilder[],
  timeout = 120000,
  ephemeral:boolean = false,
): Promise<Message> {
  if (interaction.deferred === false) {
    await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
  }
  // log.debug(`${PREFIX} - Paginating ${pages.length} pages.`);

  let page = 0;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonList);

  const curPage = await interaction.editReply({
    embeds: [
      pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` }),
    ],
    components: [row],
  });

  // There is a bug in the typescript definition of the buttonList[x].data.customId
  // @ts-ignore https://discord.com/channels/222078108977594368/824411059443204127/1013418391584899202
  const filter = (i:Interaction) => i.customId === buttonList[1].data.custom_id // @ts-ignore
    || i.customId === buttonList[0].data.custom_id;

  const collector = curPage.createMessageComponentCollector({
    filter,
    time: timeout,
  });

  collector.on('collect', async (i:ButtonInteraction) => {
    switch (i.customId) {
      // @ts-ignore
      case buttonList[0].data.custom_id:
        page = page > 0 ? page - 1 : pages.length - 1;
        break;
      // @ts-ignore
      case buttonList[1].data.custom_id:
        page = page + 1 < pages.length ? page + 1 : 0;
        break;
      default:
        break;
    }
    await i.deferUpdate();
    await i.editReply({
      embeds: [
        pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` }),
      ],
      components: [row],
    });
    collector.resetTimer();
  });

  collector.on('end', (_, reason) => {
    if (reason !== 'messageDelete') {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonList[0].setDisabled(true),
        buttonList[1].setDisabled(true),
      );
      curPage.edit({
        embeds: [
          pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` }),
        ],
        components: [disabledRow],
      });
    }
  });

  return curPage;
}
