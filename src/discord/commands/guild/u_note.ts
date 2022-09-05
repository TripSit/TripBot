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
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
const PREFIX = require('path').parse(__filename).name;

const embed = embedTemplate();

let actor = {} as GuildMember;
let target = {} as GuildMember | string;
const command = 'note';

let reason = 'What are you noting about this person?';

export const info: UserCommand = {
  data: new ContextMenuCommandBuilder()
      .setName('u_note')
      .setType(ApplicationCommandType.User),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member as GuildMember;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.targetMember as GuildMember;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Create the modal
    const modal = new ModalBuilder()
        .setCustomId('noteModal')
        .setTitle('Tripbot Note');
    const noteReason = new TextInputBuilder()
        .setLabel('What are you noting about this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(reason)
        .setCustomId('noteReason')
        .setRequired(true);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(noteReason);

    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    reason = interaction.fields.getTextInputValue('noteReason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    embed.setTitle('Tripbot Note');
    embed.setDescription(`${actor.user.username} has noted ${(target as GuildMember).user.username}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    const result = await moderate(actor, command, target, undefined, 'on', reason, undefined, interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.reply({embeds: [embed], ephemeral: true});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
