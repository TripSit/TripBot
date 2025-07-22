import type {
  GuildMember,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  ModalSubmitInteraction,
} from 'discord.js';

import { MessageFlags, TextInputStyle } from 'discord-api-types/v10';
import { ActionRowBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { botmod } from '../../../global/commands/g.botmod';
import commandContext from '../../utils/context';

const F = f(__filename);

type GuildActionType = 'BOTBAN' | 'BOTINFO' | 'BOTKICK' | 'BOTNOTE' | 'BOTWARNING' | 'UNBOTBAN';
type UserActionType = 'BOTBAN' | 'UNBOTBAN';

export const dBotmod: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botmod')
    .setDescription('Bot Mod Actions!')
    .setIntegrationTypes([0])
    .addSubcommandGroup((subcommandgroup) =>
      subcommandgroup
        .setName('guild')
        .setDescription('Bot mod guilds')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('botinfo')
            .setDescription('Info on an ID')
            .addStringOption((option) =>
              option.setName('target').setDescription('Guild ID to get info on!').setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('botwarn')
            .setDescription('Warn an ID')
            .addStringOption((option) =>
              option.setName('target').setDescription('Guild to warn!').setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('botkick')
            .setDescription('Kick an ID')
            .addStringOption((option) =>
              option.setName('target').setDescription('Guild to kick!').setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('botban')
            .setDescription('Ban an ID')
            .addStringOption((option) =>
              option.setName('target').setDescription('Guild to ban!').setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName('toggle')
                .setDescription('On off?')
                .addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })
                .setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((subcommandgroup) =>
      subcommandgroup
        .setName('user')
        .setDescription('Bot mod users')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('botinfo')
            .setDescription('Info on an ID')
            .addStringOption((option) =>
              option.setName('target').setDescription('User ID to get info!').setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('botwarn')
            .setDescription('Warn an ID')
            .addStringOption((option) =>
              option.setName('target').setDescription('User to warn!').setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('botban')
            .setDescription('Ban an ID')
            .addStringOption((option) =>
              option.setName('target').setDescription('User to ban!').setRequired(true),
            )
            // eslint-disable-next-line
      // .addStringOption(option => option.setName('duration').setDescription('Duration of ban!').setRequired(true))
            .addStringOption((option) =>
              option
                .setName('toggle')
                .setDescription('On off?')
                .addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })
                .setRequired(true),
            ),
        ),
    ),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    const group = interaction.options.getSubcommandGroup() as 'guild' | 'user';
    const actor = interaction.member as GuildMember;
    let command = interaction.options.getSubcommand().toUpperCase() as
      | GuildActionType
      | UserActionType;
    const targetId = interaction.options.getString('target', true);

    if (command === 'BOTINFO') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
    switch (command) {
      case 'BOTBAN': {
        verb = 'banning';

        break;
      }
      case 'BOTKICK': {
        verb = 'kicking';

        break;
      }
      case 'BOTWARNING': {
        verb = 'warning';

        break;
      }
      case 'UNBOTBAN': {
        verb = 'unbanning';

        break;
      }
      // No default
    }

    const modal = new ModalBuilder()
      .setCustomId(`botModModal~${interaction.id}`)
      .setTitle(`Tripbot bot ${command}`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setLabel(`Why are you ${verb} this ${group}?`)
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Tell the team why you're doing this")
            .setRequired(true)
            .setCustomId('privReason'),
        ),
      );

    if (['BAN', 'KICK', 'UNBAN', 'WARN'].includes(command)) {
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setLabel(`What should we tell the ${group}?`)
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(`Tell ${group} why you're doing this`)
            .setRequired(true)
            .setCustomId('pubReason'),
        ),
      );
    }

    await interaction.showModal(modal);

    const filter = (index: ModalSubmitInteraction) => index.customId.startsWith('botModModal');
    interaction.awaitModalSubmit({ filter, time: 0 }).then(async (index) => {
      if (index.customId.split('~')[1] !== interaction.id) {
        return;
      }
      await index.deferReply({ flags: MessageFlags.Ephemeral });
      const toggle = interaction.options.getString('toggle') ?? ('on' as 'off' | 'on');

      if (toggle === 'off' && command === 'BOTBAN') {
        command = `UN${command}`;
      }

      const privReason = index.fields.getTextInputValue('privReason');
      let pubReason = '';
      try {
        pubReason = index.fields.getTextInputValue('pubReason');
      } catch {
        // ignore
      }
      await index.editReply(
        (await botmod(
          interaction,
          group,
          actor,
          command,
          targetId,
          privReason,
          pubReason,
        )) as InteractionEditReplyOptions,
      );
    });
    return false;
  },
};

export default dBotmod;
