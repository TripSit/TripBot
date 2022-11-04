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
import log from '../../../global/utils/log';
import * as path from 'path';
import {env} from 'process';
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
    log.debug(`[${PREFIX}] started!`);
    // Only run on tripsit
    if (!interaction.guild) {
      await interaction.reply({content: 'This command can only be used in a server!', ephemeral: true});
      return false;
    }

    if (interaction.guild.id !== env.DISCORD_GUILD_ID) {
      await interaction.reply({content: 'This command can only be used in the Tripsit server!', ephemeral: true});
      return false;
    }

    // await interaction.deferReply({ephemeral: true});
    // const embed = embedTemplate()
    //   .setColor(Colors.DarkBlue)
    //   .setDescription('Reporting...');
    // await interaction.editReply({embeds: [embed]});

    const target = interaction.options.getString('target') as string;
    log.debug(`[${PREFIX}] target: ${target}`);
    const targetId = target.replace(/[<@!>]/g, '');
    log.debug(`[${PREFIX}] targetId: ${targetId}`);
    const targetMember = await interaction.guild.members.fetch(targetId) as GuildMember;
    log.debug(`[${PREFIX}] targetMember: ${targetMember}`);

    const modal = new ModalBuilder()
      .setCustomId(`modModal~report~${interaction.id}`)
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
      .then(async (i) => {
        if (i.customId.split('~')[2] !== interaction.id) return;
        const privReason = i.fields.getTextInputValue('privReason');
        const result = await moderate(
          i.member as GuildMember,
          'report',
          targetMember,
          privReason,
          null,
          null,
          i,
        );
        log.debug(`[${PREFIX}] Result: ${result}`);
        i.reply(result);
        log.debug(`[${PREFIX}] finished!`);
      });
    return true;
  },
};
