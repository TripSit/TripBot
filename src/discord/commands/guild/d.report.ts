import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // Colors,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
import {moderate} from '../../../global/commands/g.moderate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;


export const report: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addStringOption((option) => option
      .setDescription('User to report!')
      .setRequired(true)
      .setName('target')),

  async execute(interaction: ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] started!`);
    // await interaction.deferReply({ephemeral: true});
    // const embed = embedTemplate()
    //   .setColor(Colors.DarkBlue)
    //   .setDescription('Reporting...');
    // await interaction.editReply({embeds: [embed]});

    const target = interaction.options.getString('target')!;
    logger.debug(`[${PREFIX}] target: ${target}`);
    const targetId = target.replace(/[<@!>]/g, '');
    logger.debug(`[${PREFIX}] targetId: ${targetId}`);
    const targetMember = await interaction.guild!.members.fetch(targetId) as GuildMember;
    logger.debug(`[${PREFIX}] targetMember: ${targetMember}`);

    const modal = new ModalBuilder()
      .setCustomId(`modModal~report`)
      .setTitle(`Tripbot report`);
    const privReason = new TextInputBuilder()
      .setLabel(`Why are you reporting this user?`)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(`Tell the team why you're doing this`)
      .setRequired(true)
      .setCustomId('privReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReason);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);

    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.startsWith(`modModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (interaction) => {
        const privReason = interaction.fields.getTextInputValue('privReason');
        const result = await moderate(
          interaction.member as GuildMember,
          'report',
          targetMember,
          privReason,
          null,
          null,
          interaction,
        );
        logger.debug(`[${PREFIX}] Result: ${result}`);
        interaction.reply(result);
        logger.debug(`[${PREFIX}] finished!`);
      });
  },
};
