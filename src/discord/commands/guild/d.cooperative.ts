import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  InteractionEditReplyOptions,
  ButtonBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  Guild,
  EmbedBuilder,
  TextChannel,
  Role,
  PermissionResolvable,
  ChannelType,
} from 'discord.js';
import {
  ButtonStyle,
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkGuildPermissions } from '../../utils/checkPermissions';
import commandContext from '../../utils/context';
import { getCommandLocalizations, getLocale, t } from '../../../i18n/index';

const F = f(__filename);

async function info(locale: string): Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate({
        title: t(locale, 'cooperative', 'infoTitle'),
        description: t(locale, 'cooperative', 'infoDescription'),
        fields: [
          {
            name: t(locale, 'cooperative', 'infoRule1Name'),
            value: t(locale, 'cooperative', 'infoRule1Value'),
            inline: false,
          },
          {
            name: t(locale, 'cooperative', 'infoRule2Name'),
            value: t(locale, 'cooperative', 'infoRule2Value'),
            inline: false,
          },
          {
            name: t(locale, 'cooperative', 'infoRule3Name'),
            value: t(locale, 'cooperative', 'infoRule3Value'),
            inline: false,
          },
        ],
      }),
    ],
  };
}

async function apply(interaction:ChatInputCommandInteraction, locale: string): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'guildOnlyError'),
        }),
      ],
    };
  }

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  if (guildData.cooperative) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'alreadyMemberError'),
        }),
      ],
    };
  }
  return {
    embeds: [
      embedTemplate({
        title: t(locale, 'cooperative', 'applyTitle'),
        description: t(locale, 'cooperative', 'applyDescription'),
      }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('cooperativeApply')
            .setLabel(t(locale, 'cooperative', 'applyButtonLabel'))
            .setStyle(ButtonStyle.Primary),
        ),
    ],
  };
}

export async function cooperativeApplyButton(
  interaction:ButtonInteraction,
) {
  await interaction.showModal(new ModalBuilder()
    .setTitle(t('en-US', 'cooperative', 'modalTitle'))
    .setCustomId(`cooperativeApply~${interaction.id}`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t('en-US', 'cooperative', 'modalWebsiteLabel'))
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('desire'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t('en-US', 'cooperative', 'modalWhyLabel'))
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(t('en-US', 'cooperative', 'modalWhyPlaceholder'))
            .setRequired(true)
            .setCustomId('desire'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t('en-US', 'cooperative', 'modalInviteLabel'))
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(t('en-US', 'cooperative', 'modalInvitePlaceholder'))
            .setRequired(true)
            .setCustomId('link'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t('en-US', 'cooperative', 'modalAgreeLabel'))
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('agree'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t('en-US', 'cooperative', 'modalInfoLabel'))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setCustomId('info'),
        ),
    ));
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('reportModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      await i.editReply({
        embeds: [
          embedTemplate({
            title: t('en-US', 'cooperative', 'applyThanksTitle'),
            description: t('en-US', 'cooperative', 'applyThanksDescription'),
          }),
        ],
      });
    });
  return true;
}

async function setup(interaction:ChatInputCommandInteraction, locale: string):Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'guildOnlyError'),
        }),
      ],
    };
  }

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  if (!guildData.cooperative) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'notMemberError'),
        }),
      ],
    };
  }

  const perms = await checkGuildPermissions(interaction.guild, [
    'ViewAuditLog' as PermissionResolvable,
  ]);

  if (!perms.hasPermission) {
    log.error(F, `Missing permission ${perms.permission} in ${interaction.guild}!`);
    return { content: `Please make sure I can ${perms.permission} in ${interaction.guild} so I can run ${F}!` };
  }

  // Finished checks, lets set this up!

  // Get the IDs of the channels

  let helpdeskRoom = interaction.options.getChannel('helpdesk_channel');
  if (!helpdeskRoom) {
    // If the channel wasn't provided, create it:
    helpdeskRoom = await interaction.guild.channels.create({
      name: '🙊│talk-to-mods',
      type: ChannelType.GuildText,
      topic: 'This channel is used to make tickets.',
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
      ],
    });
  }
  await db.discord_guilds.update({
    where: { id: interaction.guild.id },
    data: { channel_helpdesk: helpdeskRoom.id },
  });

  let trustRoom = interaction.options.getChannel('trust_channel');
  if (!trustRoom) {
    // If the channel wasn't provided, create it:
    trustRoom = await interaction.guild.channels.create({
      name: '🔒│trust-log',
      type: ChannelType.GuildText,
      topic: 'This channel is used to oversee the trust logging.',
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
      ],
    });
  }
  await db.discord_guilds.update({
    where: { id: interaction.guild.id },
    data: { channel_trust: trustRoom.id },
  });

  const trustScoreLimit = interaction.options.getInteger('trust_score_limit', true);
  await db.discord_guilds.update({
    where: { id: interaction.guild.id },
    data: { trust_score_limit: trustScoreLimit },
  });

  let modRoom = interaction.options.getChannel('mod_channel');
  if (!modRoom) {
    // If the channel wasn't provided, create it:
    modRoom = await interaction.guild.channels.create({
      name: 'coop-mod',
      type: ChannelType.GuildText,
      topic: 'This channel is used for cooperative moderation.',
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
      ],
    });
  }

  await db.discord_guilds.update({
    where: {
      id: interaction.guild.id,
    },
    data: {
      channel_moderators: modRoom.id,
    },
  });

  let modLog = interaction.options.getChannel('modlog_channel');
  if (!modLog) {
    // If the channel wasn't provided, create it:
    modLog = await interaction.guild.channels.create({
      name: 'modlog',
      type: ChannelType.GuildText,
      topic: 'This channel is used for moderation logs.',
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
      ],
    });
  }

  await db.discord_guilds.update({
    where: {
      id: interaction.guild.id,
    },
    data: {
      channel_mod_log: modLog.id,
    },
  });
  // const helpdesk = interaction.options.getChannel('helpdesk_channel', true);
  // const coopGen = interaction.options.getChannel('coop_gen_channel', true);
  // const coopAnnounce = interaction.options.getChannel('coop_announce_channel', true);
  // const coopOfftopic = interaction.options.getChannel('coop_offtopic_channel', true);

  let modRole = interaction.options.getRole('mod_role');
  if (!modRole) {
    // If the role wasn't provided, create it:
    modRole = await interaction.guild.roles.create({
      name: 'Cooperative Moderator',
      color: '#00ff00',
      mentionable: true,
    });
  }

  await db.discord_guilds.update({
    where: {
      id: interaction.guild.id,
    },
    data: {
      role_moderator: modRole.id,
    },
  });

  log.debug(F, `modRoomId: ${modRoom.name}`);
  log.debug(F, `modLogId: ${modLog.name}`);

  async function getRoleId(
    role:Role | undefined,
  ):Promise<string> {
    // This will create the role if it doesn't exist
    // Either way it will update the database with the role ID
    if (!interaction.guild) return '';
    if (!role) {
      // If the role wasn't provided, create it:
      const newRole = await interaction.guild.roles.create({
        name: 'Cooperative Moderator',
        color: '#00ff00',
        mentionable: true,
      });
      await db.discord_guilds.update({
        where: {
          id: interaction.guild.id,
        },
        data: {
          role_moderator: newRole.id,
        },
      });
      return newRole.id;
    }
    await db.discord_guilds.update({
      where: {
        id: interaction.guild.id,
      },
      data: {
        role_moderator: role.id,
      },
    });
    return role.id;
  }

  const modRoleId = await getRoleId(modRole as Role | undefined);

  log.debug(F, `modRoleId: ${modRoleId}`);

  return {
    embeds: [
      embedTemplate({
        title: t(locale, 'cooperative', 'setupCompleteTitle'),
        description: t(locale, 'cooperative', 'setupCompleteDescription', { channel: modRoom.name }),
      }),
    ],
  };
}

async function leave(interaction:ChatInputCommandInteraction, locale: string): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'guildOnlyError'),
        }),
      ],
    };
  }

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  if (!guildData.cooperative) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'notMemberError'),
        }),
      ],
    };
  }

  return {
    embeds: [
      embedTemplate({
        title: t(locale, 'cooperative', 'leaveTitle'),
        description: t(locale, 'cooperative', 'leaveDescription'),
      }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('cooperativeLeave')
            .setLabel(t(locale, 'cooperative', 'leaveButtonLabel'))
            .setStyle(ButtonStyle.Danger),
        ),
    ],
  };
}

export async function cooperativeLeaveButton(
  interaction:ButtonInteraction,
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild as Guild;
  await db.discord_guilds.upsert({
    where: {
      id: guild.id,
    },
    create: {
      id: guild.id,
      cooperative: false,
    },
    update: {
      cooperative: false,
    },
  });
  await interaction.editReply({
    embeds: [
      embedTemplate({
        title: t('en-US', 'cooperative', 'leftTitle'),
      }),
    ],
  });
}

async function add(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<InteractionEditReplyOptions> {
  if (interaction.user.id !== env.DISCORD_OWNER_ID) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'restrictedError'),
        }),
      ],
    };
  }

  const guild = await discordClient.guilds.fetch(interaction.options.getString('guild_id', true));
  await db.discord_guilds.upsert({
    where: {
      id: guild.id,
    },
    create: {
      id: guild.id,
      cooperative: true,
    },
    update: {
      cooperative: true,
    },
  });

  return {
    embeds: [
      embedTemplate({
        title: t(locale, 'cooperative', 'addedTitle', { guild: guild.name }),
      }),
    ],
  };
}

async function remove(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<InteractionEditReplyOptions> {
  if (interaction.user.id !== env.DISCORD_OWNER_ID) {
    return {
      embeds: [
        embedTemplate({
          title: t(locale, 'cooperative', 'restrictedError'),
        }),
      ],
    };
  }

  const guild = await discordClient.guilds.fetch(interaction.options.getString('guild_id', true));
  await db.discord_guilds.upsert({
    where: {
      id: guild.id,
    },
    create: {
      id: guild.id,
      cooperative: false,
    },
    update: {
      cooperative: false,
    },
  });
  return {
    embeds: [
      embedTemplate({
        title: t(locale, 'cooperative', 'removedTitle', { guild: guild.name }),
      }),
    ],
  };
}

export async function sendCooperativeMessage(
  embed: EmbedBuilder,
  pingGuilds: string[],
) {
  await Promise.all(pingGuilds.map(async guildId => {
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: guildId,
      },
      create: {
        id: guildId,
        cooperative: false,
      },
      update: {
        cooperative: false,
      },
    });
    const guild = await discordClient.guilds.fetch(guildId);
    if (guildData.channel_moderators && guildData.role_moderator) {
      let channelCoopMod = {} as TextChannel;
      try {
        channelCoopMod = await discordClient.channels.fetch(guildData.channel_moderators) as TextChannel;
      } catch (e) {
        guildData.channel_moderators = null;
        await db.discord_guilds.update({
          where: {
            id: guildId,
          },
          data: guildData,
        });
      }

      let roleMod = {} as Role;
      try {
        roleMod = await guild.roles.fetch(guildData.role_moderator) as Role;
      } catch (e) {
        guildData.role_moderator = null;
        await db.discord_guilds.update({
          where: {
            id: guildId,
          },
          data: guildData,
        });
      }

      await channelCoopMod.send({
        content: `Hey ${roleMod}!`,
        embeds: [embed],
      });
    }
  }));
}

export const dCooperative: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(t('en-US', 'cooperative', 'commandName'))
    .setNameLocalizations(getCommandLocalizations('cooperative', 'commandName'))
    .setDescription(t('en-US', 'cooperative', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('info')
      .setDescription(t('en-US', 'cooperative', 'infoSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'infoSubcommand')))
    .addSubcommand(subcommand => subcommand
      .setName('apply')
      .setDescription(t('en-US', 'cooperative', 'applySubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'applySubcommand')))
    .addSubcommand(subcommand => subcommand
      .setName('setup')
      .setDescription(t('en-US', 'cooperative', 'setupSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'setupSubcommand'))
      .addChannelOption(option => option
        .setRequired(true)
        .setName('mod_channel')
        .setDescription(t('en-US', 'cooperative', 'modChannelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'modChannelOption')))
      .addChannelOption(option => option
        .setRequired(true)
        .setName('modlog_channel')
        .setDescription(t('en-US', 'cooperative', 'modlogChannelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'modlogChannelOption')))
      .addRoleOption(option => option
        .setRequired(true)
        .setName('mod_role')
        .setDescription(t('en-US', 'cooperative', 'modRoleOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'modRoleOption')))
      .addChannelOption(option => option
        .setRequired(true)
        .setName('helpdesk_channel')
        .setDescription(t('en-US', 'cooperative', 'helpdeskChannelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'helpdeskChannelOption')))
      .addChannelOption(option => option
        .setRequired(true)
        .setName('trust_channel')
        .setDescription(t('en-US', 'cooperative', 'trustChannelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'trustChannelOption')))
      .addIntegerOption(option => option
        .setRequired(true)
        .setName('trust_score_limit')
        .setDescription(t('en-US', 'cooperative', 'trustScoreLimitOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'trustScoreLimitOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('leave')
      .setDescription(t('en-US', 'cooperative', 'leaveSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'leaveSubcommand')))
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription(t('en-US', 'cooperative', 'addSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'addSubcommand'))
      .addStringOption(option => option
        .setName('guild_id')
        .setDescription(t('en-US', 'cooperative', 'addGuildIdOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'addGuildIdOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription(t('en-US', 'cooperative', 'removeSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'removeSubcommand'))
      .addStringOption(option => option
        .setName('guild_id')
        .setDescription(t('en-US', 'cooperative', 'removeGuildIdOption'))
        .setDescriptionLocalizations(getCommandLocalizations('cooperative', 'removeGuildIdOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const locale = await getLocale(interaction, 'cooperative');

    if (!interaction.guild) {
      await interaction.editReply({
        embeds: [
          embedTemplate({
            title: t(locale, 'cooperative', 'guildOnlyError'),
          }),
        ],
      });
      return false;
    }

    let response = {} as InteractionEditReplyOptions;
    const command = interaction.options.getSubcommand();
    switch (command) {
      case 'info':
        response = await info(locale);
        break;
      case 'apply':
        response = await apply(interaction, locale);
        break;
      case 'setup':
        response = await setup(interaction, locale);
        break;
      case 'leave':
        response = await leave(interaction, locale);
        break;
      case 'add':
        response = await add(interaction, locale);
        break;
      case 'remove':
        response = await remove(interaction, locale);
        break;
      default:
        break;
    }

    await interaction.editReply(response);
    return true;
  },
};

export default dCooperative;
