import {
  UserContextMenuCommandInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
  TextInputStyle,
} from 'discord-api-types/v10';
import {UserCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;


let actor = {} as GuildMember;
let target = {} as GuildMember | string;
const command = 'ban';
let reason = 'No reason provided';
// let duration = '4 days 3hrs 2 mins 30 seconds';

export const uBan: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction:UserContextMenuCommandInteraction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member as GuildMember;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.targetMember as GuildMember;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId('banModal')
      .setTitle('Tripbot Ban');
    const banReason = new TextInputBuilder()
      .setLabel('Why are you banning this user?')
      .setStyle(TextInputStyle.Paragraph)
      .setCustomId('banReason')
      .setRequired(true);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(banReason);
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    // duration = interaction.fields.getTextInputValue('banDuration');
    // logger.debug(`[${PREFIX}] duration: ${duration}`);
    reason = interaction.fields.getTextInputValue('banReason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    const result = await moderate(actor, command, target, undefined, 'on', reason, undefined, interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    interaction.reply(result);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
