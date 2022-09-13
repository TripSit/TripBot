import {
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
import {UserCommand} from '../../utils/commandDef';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

let actor = {} as GuildMember;
let target = {} as GuildMember | string;
const command = 'kick';

let reason = 'Why are you kicking this person?';

export const uKick: UserCommand = {
  data: new ContextMenuCommandBuilder()
      .setName('Kick')
      .setType(ApplicationCommandType.User),
  async execute(interaction) {
    actor = interaction.member as GuildMember;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);

    if (interaction.user.discriminator === '0000') {
      logger.debug(`[${PREFIX}] message: ${JSON.stringify(interaction.options.data[0].message, null, 2)}`);
      // This is a bot, so we need to get the username of the user
      target = interaction.user.username;
      // logger.debug(`[${PREFIX}] target: ${target}`);
    } else {
      target = interaction.targetMember as GuildMember;
    }
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Create the modal
    const modal = new ModalBuilder()
        .setCustomId('kickModal')
        .setTitle('Tripbot Kick');
    const banReason = new TextInputBuilder()
        .setLabel('Why are you kicking this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(reason)
        .setRequired(true)
        .setCustomId('kickReason');

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
    reason = interaction.fields.getTextInputValue('kickReason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    const result = await moderate(actor, command, target, undefined, 'on', reason, undefined, interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    // embed.setDescription(result);

    interaction.reply(result);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
