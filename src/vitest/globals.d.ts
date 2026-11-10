import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';

// The real declaration lives in src/start.ts, which the test type-check does not include.
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var commandContext:(
    interaction: ChatInputCommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | ModalSubmitInteraction,
  ) => Promise<string>;
}
