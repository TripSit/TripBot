import {
  MessageContextMenuCommandInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  // Colors,
  ContextMenuCommandBuilder,
  ModalSubmitInteraction,
  GuildMember,
  TextChannel,
} from 'discord.js';
import {
  ApplicationCommandType,
  TextInputStyle,
} from 'discord-api-types/v10';
import {MessageCommand} from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

let actor = {} as GuildMember;
let target = {} as GuildMember | string;
let message = {};
let channel = {} as TextChannel;
let messageUrl = '';
const command = 'warn';

export const mWarn: MessageCommand = {
  data: new ContextMenuCommandBuilder()
      .setName('Warn')
      .setType(ApplicationCommandType.Message),
  async execute(interaction:MessageContextMenuCommandInteraction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member as GuildMember;
    // logger.debug(`[${PREFIX}] actor.username: ${actor.user.username}`);
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);

    message = interaction.targetMessage.cleanContent;
    // logger.debug(`[${PREFIX}] message: ${message}`);

    messageUrl = interaction.targetMessage.url;

    if (interaction.targetMessage.author.discriminator === '0000') {
      // This is a bot, so we need to get the username of the user
      target = interaction.targetMessage.author.username;
      logger.debug(`[${PREFIX}] target: ${target}`);
    } else {
      const targetId = interaction.targetMessage.author.id;
      logger.debug(`[${PREFIX}] targetId: ${targetId}`);

      target = await interaction.guild!.members.fetch(targetId);
      // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
      logger.debug(`[${PREFIX}] target.user.username: ${target.user.username}`);
    }

    // Create the modal
    const modal = new ModalBuilder()
        .setCustomId('warnModal')
        .setTitle('Tripbot Warn');
    const warnReason = new TextInputBuilder()
        .setLabel('Why are you warning this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Why are you warning this person?')
        .setCustomId('reasonGiven')
        .setRequired(true);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(warnReason);

    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction:ModalSubmitInteraction) {
    logger.debug(`[${PREFIX}] started!`);
    // await interaction.deferReply({ ephemeral: true });
    // const embed = embedTemplate()
    //     .setColor(Colors.DarkBlue)
    //     .setDescription('Reporting...');
    // await interaction.editReply({ embeds: [embed], ephemeral: true });

    channel = interaction.channel as TextChannel;
    actor = interaction.member as GuildMember;
    logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor.displayName, null, 2)}`);
    logger.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    logger.debug(`[${PREFIX}] target: ${JSON.stringify((target as GuildMember).displayName, null, 2)}`);
    logger.debug(`[${PREFIX}] channel: ${JSON.stringify(channel.name, null, 2)}`);
    const reason = stripIndents`
    > ${interaction.fields.getTextInputValue('reasonGiven')}

    [The offending message:](${messageUrl})
    > ${message}

    `;

    const toggle = undefined;
    const duration = undefined;
    const result = await moderate(actor, command, target, channel, toggle, reason, duration, interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    // embed.setDescription(result);

    interaction.reply(result);
  },
};
