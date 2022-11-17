import {
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  Message,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const PREFIX = parse(__filename).name;

/**
 * Creates a pagination embed
 * @param {BaseCommandInteraction} interaction The interaction to paginate
 * @param {EmbedBuilder[]} pages The pages to paginate
 * @param {ButtonComponent[]} buttonList The buttons to paginate
 * @param {number} timeout The timeout in milliseconds to wait for reactions
 * @return {Promise<void>}
 */
export async function paginationEmbed(
  interaction:CommandInteraction,
  pages:EmbedBuilder[],
  buttonList:ButtonBuilder[],
  timeout = 120000,
): Promise<Message> {
  if (!pages) throw new Error('Pages are not given.');
  if (!buttonList) throw new Error('Buttons are not given.');

  if (
    buttonList[0].data.style === ButtonStyle.Link ||
    buttonList[1].data.style === ButtonStyle.Link
  ) {
    throw new Error(
      'Link buttons are not supported with discordjs-button-pagination',
    );
  }
  if (buttonList.length !== 2) throw new Error('Need two buttons.');

  if (interaction.deferred === false) {
    await interaction.deferReply();
  }
  // log.debug(`${PREFIX} - Paginating ${pages.length} pages.`);

  let page = 0;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonList);


  const curPage = await interaction.editReply({
    embeds: [
      pages[page].setFooter({text: `Page ${page + 1} / ${pages.length}`}),
    ],
    components: [row],
  });

  // There is a bug in the typescript definition of the buttonList[x].data.customId
  // @ts-ignore https://discord.com/channels/222078108977594368/824411059443204127/1013418391584899202
  const filter = (i:Interaction) => i.customId === buttonList[1].data.custom_id || // @ts-ignore
    i.customId === buttonList[0].data.custom_id;

  const collector = await curPage.createMessageComponentCollector({
    filter,
    time: timeout,
  });

  collector.on('collect', async i => {
    switch (i.customId) {
      // @ts-ignore
      case buttonList[0].data.custom_id:
        page = page > 0 ? page -= 1 : pages.length - 1;
        break;
      // @ts-ignore
      case buttonList[1].data.custom_id:
        page = page + 1 < pages.length ? page += 1 : 0;
        break;
      default:
        break;
    }
    await i.deferUpdate();
    await i.editReply({
      embeds: [
        pages[page].setFooter({text: `Page ${page + 1} / ${pages.length}`}),
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
          pages[page].setFooter({text: `Page ${page + 1} / ${pages.length}`}),
        ],
        components: [disabledRow],
      });
    }
  });

  return curPage;
};
