/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  EmbedBuilder,
  AnySelectMenuInteraction,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import commandContext from '../../utils/context';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

const tempSettings:{
  [key:string]:{ // Discord ID
    user?: string;
    channel?: string;
    role?: string;
    short?: string;
    long?: string;
  }
} = {};

namespace text {
  // Re-usable text strings
  // Set up as functions so you can pass in variables
  export function title(string:string) {
    return `Here's your title: ${string}`;
  }

  export function guildOnly() {
    return 'This command can only be used in a guild.';
  }
}

namespace type {
  // export type Command = 'pageOne' | 'pageTwo';

  export enum Command {
    pageOne = 'page_one',
    pageTwo = 'page_two',
  }

  export enum Button {
    pageOne = 'pageOne',
    pageTwo = 'pageTwo',
    textInput = 'textInput',
  }

  export enum Menu {
    channel = 'channel',
    role = 'role',
    user = 'user',
  }
}

namespace util {
  export async function navMenu(
    page: 'pageOne' | 'pageTwo',
  ):Promise<ActionRowBuilder<ButtonBuilder>> {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        button.pageOne().setStyle(page === 'pageOne' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.pageTwo().setStyle(page === 'pageTwo' ? ButtonStyle.Success : ButtonStyle.Primary),
      );
  }

  export async function textInput(
    interaction: ButtonInteraction,
  ) {
    const S = 'create';
    if (!interaction.guild) return;
    if (!interaction.member) return;

    await interaction.showModal(new ModalBuilder()
      .setCustomId(`template~${interaction.id}`)
      .setTitle('Tripsitter Help Request')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setCustomId('short')
            .setLabel('Short text input')
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setCustomId('long')
            .setLabel('Long text input')
            .setMaxLength(500)
            .setStyle(TextInputStyle.Paragraph)),
      ));

    const filter = (i: ModalSubmitInteraction) => i.customId.split('~')[0] === 'template';
    await interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (!interaction.guild) return;
        if (!interaction.member) return;
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });

        const short = i.fields.getTextInputValue('short').split('\n').map(line => `> ${line}`).join('\n');
        const long = i.fields.getTextInputValue('long').split('\n').map(line => `> ${line}`).join('\n');
        tempSettings[interaction.user.id] = {
          ...tempSettings[interaction.user.id],
          short,
          long,
        };

        await i.editReply(await page.one(interaction));
      });
  }
}

namespace page {
  export async function one(
    interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    // Pages can be activated by a command, a button, or a select menu, basically any embed interaction
    // We return the Interaction Edit Reply Options so that each interaction handler can return in the expected way:
    // IE: Slash commands use an .editReply() method, buttons and select menus use an .update() method
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };
    log.info(F, await commandContext(interaction));
    const S = 'one';

    const components:ActionRowBuilder<ButtonBuilder | UserSelectMenuBuilder | ChannelSelectMenuBuilder | RoleSelectMenuBuilder>[] = [
      await util.navMenu('pageOne'),
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(button.textInput()),
      new ActionRowBuilder<UserSelectMenuBuilder>()
        .addComponents(select.user()),
      new ActionRowBuilder<ChannelSelectMenuBuilder>()
        .addComponents(select.channel()),
      new ActionRowBuilder<RoleSelectMenuBuilder>()
        .addComponents(select.role()),
    ];

    return {
      embeds: [
        embedTemplate()
          .setTitle('Template Page One')
          .setDescription(stripIndents`
            This is a first page
            ### Short Text
            ${tempSettings[interaction.user.id]?.short ?? 'None'}
            ### Long Text
            ${tempSettings[interaction.user.id]?.long ?? 'None'}
            ### User 
            ${tempSettings[interaction.user.id]?.user ?? 'None'}
            ### Channel
            ${tempSettings[interaction.user.id]?.channel ?? 'None'}
            ### Role
            ${tempSettings[interaction.user.id]?.role ?? 'None'}
          `),
      ],
      components,
    };
  }

  export async function two(
    interaction: ChatInputCommandInteraction
    | ButtonInteraction
    | AnySelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };
    log.info(F, await commandContext(interaction));
    const S = 'two';

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle('Page Two')
          .setDescription(stripIndents`
            This is a second page
          `),
      ],
      components: [
        await util.navMenu('pageTwo'),
      ],
    };
  }
}

namespace button {
  export function pageOne() {
    return new ButtonBuilder()
      .setCustomId(`template~${type.Button.pageOne}`)
      .setLabel('Page One')
      .setEmoji('🔴')
      .setStyle(ButtonStyle.Primary);
  }

  export function pageTwo() {
    return new ButtonBuilder()
      .setCustomId(`template~${type.Button.pageTwo}`)
      .setLabel('Page Two')
      .setEmoji('🟢')
      .setStyle(ButtonStyle.Primary);
  }

  export function textInput() {
    return new ButtonBuilder()
      .setCustomId(`template~${type.Button.textInput}`)
      .setLabel('Text')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Primary);
  }
}

namespace select {
  export function channel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId(`template~${type.Menu.channel}`)
      .setPlaceholder('Channel')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function role() {
    return new RoleSelectMenuBuilder()
      .setCustomId(`template~${type.Menu.role}`)
      .setPlaceholder('Role')
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function user() {
    return new UserSelectMenuBuilder()
      .setCustomId(`template~${type.Menu.user}`)
      .setPlaceholder('User')
      .setMinValues(0)
      .setMaxValues(1);
  }
}

// The only functions we export are those that are used in the event handlers
export async function templateSelect(
  interaction: AnySelectMenuInteraction,
): Promise<void> {
  // Used in selectMenu.ts
  // You must add the following to the selectMenu.ts file
  // if (menuID.startsWith('template')) {
  //   await templateSelect(interaction);
  // }
  if (!interaction.guild) return;
  const S = 'templateSelect';
  const menuId = interaction.customId;
  // log.debug(F, `[${S}] menuId: ${menuId}`);
  const [, menuAction] = menuId.split('~') as [null, type.Menu ];

  // log.debug(F, `[${S}] tempSettings: ${JSON.stringify(tempSettings, null, 2)}`);

  switch (menuAction) {
    case 'channel': {
      tempSettings[interaction.user.id] = {
        ...tempSettings[interaction.user.id],
        channel: interaction.values[0],
      };
      break;
    }
    case 'role': {
      tempSettings[interaction.user.id] = {
        ...tempSettings[interaction.user.id],
        role: interaction.values[0],
      };
      break;
    }
    case 'user': {
      tempSettings[interaction.user.id] = {
        ...tempSettings[interaction.user.id],
        user: interaction.values[0],
      };
      break;
    }
    default:
      break;
  }

  await interaction.update(await page.one(interaction));
}

export async function templateButton(
  interaction: ButtonInteraction,
): Promise<void> {
  // Used in buttonClick.ts
  // You must add the following to the buttonClick.ts file
  // if (buttonID.startsWith('template')) {
  //   await templateButton(interaction);
  // }
  log.debug(F, 'templateButton');
  const buttonID = interaction.customId;
  // log.debug(F, `[${S}] buttonID: ${buttonID}`);
  const [, action] = buttonID.split('~') as [null, type.Button];

  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (action) {
    case 'pageOne':
      await interaction.update(await page.one(interaction));
      break;
    case 'pageTwo':
      await interaction.update(await page.two(interaction));
      break;
    case 'textInput':
      await util.textInput(interaction);
      break;
    default:
      break;
  }
}

export const templateCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Template Command')
    .addSubcommand(subcommand => subcommand
      .setDescription('Page One')
      .setName('page_one'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Page Two')
      .setName('page_two')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand() as type.Command;
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (subcommand) {
      case 'page_one':
        await interaction.editReply(await page.one(interaction));
        break;
      case 'page_two':
        await interaction.editReply(await page.two(interaction));
        break;
      default:
        break;
    }
    return true;
  },
};

export default templateCommand;
