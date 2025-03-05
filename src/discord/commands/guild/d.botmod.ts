/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  GuildMember,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { botmod } from '../../../global/commands/g.botmod';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';

const F = f(__filename);

type GuildActionType = 'BOTKICK' | 'BOTBAN' | 'UNBOTBAN' | 'BOTWARNING' | 'BOTNOTE' | 'BOTINFO';
type UserActionType = 'BOTBAN' | 'UNBOTBAN';

export const dBotmod: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botmod')
    .setDescription('Bot Mod Actions!')
    .setIntegrationTypes([0])
    .addSubcommandGroup(subcommandgroup => subcommandgroup
      .setName('guild')
      .setDescription('Bot mod guilds')
      .addSubcommand(subcommand => subcommand
        .setName('botinfo')
        .setDescription('Info on an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild ID to get info on!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botwarn')
        .setDescription('Warn an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild to warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botkick')
        .setDescription('Kick an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild to kick!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botban')
        .setDescription('Ban an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild to ban!')
          .setRequired(true))
        .addStringOption(option => option
          .setName('toggle')
          .setDescription('On off?')
          .addChoices(
            { name: 'On', value: 'on' },
            { name: 'Off', value: 'off' },
          )
          .setRequired(true))))
    .addSubcommandGroup(subcommandgroup => subcommandgroup
      .setName('user')
      .setDescription('Bot mod users')
      .addSubcommand(subcommand => subcommand
        .setName('botinfo')
        .setDescription('Info on an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User ID to get info!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botwarn')
        .setDescription('Warn an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botban')
        .setDescription('Ban an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to ban!')
          .setRequired(true))
        // eslint-disable-next-line
      // .addStringOption(option => option.setName('duration').setDescription('Duration of ban!').setRequired(true))
        .addStringOption(option => option
          .setName('toggle')
          .setDescription('On off?')
          .addChoices(
            { name: 'On', value: 'on' },
            { name: 'Off', value: 'off' },
          )
          .setRequired(true)))),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    const group = interaction.options.getSubcommandGroup() as 'user' | 'guild';
    const actor = interaction.member as GuildMember;
    let command = interaction.options.getSubcommand().toUpperCase() as GuildActionType | UserActionType;
    const targetId = interaction.options.getString('target', true);

    if (command === 'BOTINFO') {
      await interaction.deferReply({ ephemeral: true });
      const replyOptions: InteractionReplyOptions = await botmod(
        interaction,
        group,
        actor,
        command,
        targetId,
        null,
        null,
      );
      await interaction.editReply(replyOptions as InteractionEditReplyOptions);
      return true;
    }

    let verb = '';
    if (command === 'BOTBAN') {
      verb = 'banning';
    } else if (command === 'UNBOTBAN') {
      verb = 'unbanning';
    } else if (command === 'BOTWARNING') {
      verb = 'warning';
    } else if (command === 'BOTKICK') {
      verb = 'kicking';
    }

    const modal = new ModalBuilder()
      .setCustomId(`botModModal~${interaction.id}`)
      .setTitle(`Tripbot bot ${command}`)
      .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${verb} this ${group}?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you\'re doing this')
        .setRequired(true)
        .setCustomId('privReason')));

    if (['WARN', 'KICK', 'BAN', 'UNBAN'].includes(command)) {
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel(`What should we tell the ${group}?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(`Tell ${group} why you're doing this`)
        .setRequired(true)
        .setCustomId('pubReason')));
    }

    await interaction.showModal(modal);

    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('botModModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const toggle = interaction.options.getString('toggle') ?? 'on' as 'on' | 'off';

        if (toggle === 'off' && command === 'BOTBAN') {
          command = `UN${command}`;
        }

        const privReason = i.fields.getTextInputValue('privReason');
        let pubReason = '';
        try {
          pubReason = i.fields.getTextInputValue('pubReason');
        } catch (e) {
          // ignore
        }
        await i.editReply(await botmod(interaction, group, actor, command, targetId, privReason, pubReason) as InteractionEditReplyOptions);
      });
    return false;
  },
};

export default dBotmod;
