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
import {UserCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
const PREFIX = require('path').parse(__filename).name;


let actor = {} as GuildMember;
let target = {} as GuildMember | string;
const command = 'ban';
let reason = 'Why are you banning this person?';
let duration = '4 days 3hrs 2 mins 30 seconds';
const embed = embedTemplate();

export const ban: UserCommand = {
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
        .setLabel('Why are you banning this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(reason)
        .setCustomId('banReason')
        .setRequired(true);
    const banDuration = new TextInputBuilder()
        .setLabel('How long should this ban last?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(duration)
        .setCustomId('banDuration');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(banReason);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(banDuration);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    duration = interaction.fields.getTextInputValue('banDuration');
    logger.debug(`[${PREFIX}] duration: ${duration}`);
    reason = interaction.fields.getTextInputValue('banReason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    embed.setTitle('Tripbot Ban');
    embed.setDescription(`${actor.user.username} has banned ${(target as GuildMember).user.username}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    const result = await moderate(actor, command, target, undefined, 'on', reason, duration, interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.reply({embeds: [embed], ephemeral: true});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
