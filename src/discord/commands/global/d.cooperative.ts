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
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndent, stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkGuildPermissions } from '../../utils/checkPermissions';
import commandContext from '../../utils/context';

const F = f(__filename);

const guildOnlyError = 'This command can only be used in a guild!';

async function info(): Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate({
        title: 'TripSit Discord Cooperative Info',
        description: stripIndent`
        This command will set up your guild when you first join the cooperative.
        It will perform the following tasks:
        * Create a channel called '#moderators'
        - This channel will be used for cooperative moderation.
        - Ban messages will be sent here when you ban someone for the rest of the cooperative to see
        - You can reach out to other guilds through this channel to clarify bans.
        * Create a channel called '#modlog'
        - This will be used to track moderation actions *by your own team* and to keep them accountable.
        - Only ban alerts and messages are sent to #coop-mod for other guilds to see.
        * Create a channel called '#helpdesk'
        - This is a moderation ticketing system


        **** TBD ****
        * Create a channel called '#coop-gen'
        - This channel will be used for general cooperative chat.
        - Talk about moderation policies or whatever with other moderators.
        * Create a channel called '#coop-announce'
        - Announcements impacting the entire cooperative will be posted here
        * Create a channel called '#coop-offtopic'
        - This channel will be used for general cooperative chat, get to know others!

        Once setup is complete you can modify the category and channels as you wish.
        You can move the channels outside the category if you wish, just make sure TripBot keeps the same permissions.

        If you have any questions, feel free to reach out to the TripSit team!
        
        Here is a list of all the regulations for the TripSit Discord Cooperative:`,
        fields: [
          {
            name: '1. Be kind and respectful to others.',
            value: stripIndents`This is the most important rule. We are all here to help each other and have a good time. 
            If someone from a member organization is not kind and respectful to others, their entire guild may removed from the cooperative.
            Harassment of any kind will not be tolerated, please don't try to find the line. If you are unsure if something is harassment, it probably is.`,
            inline: false,
          },
          {
            name: '2. Promote harm reduction',
            value: stripIndents`Ever guild in the cooperative is expected to promote harm reduction in their own way.
            This can be done through education, moderation, or any other means.
            Guilds that glorify or encourage drug use will be removed from the cooperative.`,
            inline: false,
          },
          {
            name: '3. Keep your ban descriptions accurate and descriptive when possible.',
            value: stripIndents`Every guild is free to set their rules and choose who to ban.
            You can ban anyone for any reason and say as little or as much as you want in the ban reason.
            However be prepared to explain your ban reason if asked if they are vague.`,
            inline: false,
          },
        ],
      }),
    ],
  };
}

async function apply(interaction:ChatInputCommandInteraction): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return {
      embeds: [
        embedTemplate({
          title: guildOnlyError,
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
          title: 'You are already part of the cooperative!',
        }),
      ],
    };
  }
  return {
    embeds: [
      embedTemplate({
        title: 'Join the TripSit Discord Cooperative',
        description: stripIndents`
            Thanks for your interest! At this time (April 3rd) this is a brand-new system \
            so there is no application process.... yet!
            However, if you are interested in joining the cooperative, please fill out the form below and we will keep you in mind \
            and perhaps reach out in the future!`,
      }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('cooperativeApply')
            .setLabel('Apply')
            .setStyle(ButtonStyle.Primary),
        ),
    ],
  };
}

export async function cooperativeApplyButton(
  interaction:ButtonInteraction,
) {
  await interaction.showModal(new ModalBuilder()
    .setTitle('Apply to Join the TripSit Discord Cooperative')
    .setCustomId(`cooperativeApply~${interaction.id}`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Does your guild have a website?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('desire'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Why do you want to join the cooperative?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Please be descriptive!')
            .setRequired(true)
            .setCustomId('desire'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Enter your guild invite link')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('People from the cooperative may join and check out your guild!')
            .setRequired(true)
            .setCustomId('link'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Have you read the regulations and agree to abide them?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('agree'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Any other info you want to share?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setCustomId('info'),
        ),
    ));
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('reportModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      await i.editReply({
        embeds: [
          embedTemplate({
            title: 'Thanks for your interest!',
            description: 'We will keep you in mind and perhaps reach out in the future!',
          }),
        ],
      });
    });
  return true;
}

async function setup(interaction:ChatInputCommandInteraction):Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return {
      embeds: [
        embedTemplate({
          title: guildOnlyError,
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
          title: 'You are not part of the cooperative!',
        }),
      ],
    };
  }

  if (!interaction.guild) {
    return {
      embeds: [
        embedTemplate({
          title: guildOnlyError,
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
        title: 'Cooperative setup complete!',
        description: stripIndents`
        I will make new threads in ${modRoom.name}`,
      }),
    ],
  };
}

async function leave(interaction:ChatInputCommandInteraction): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return {
      embeds: [
        embedTemplate({
          title: guildOnlyError,
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
          title: 'You are not part of the cooperative!',
        }),
      ],
    };
  }

  return {
    embeds: [
      embedTemplate({
        title: 'Leave the TripSit Discord Cooperative',
        description: stripIndents`
        Are you sure you want to leave the cooperative?
        This will remove your guild from the cooperative and remove your guild from the list of cooperative members.
        You will no longer be able to use the cooperative commands.
        If you change your mind, you can rejoin the cooperative at any time.`,
      }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('cooperativeLeave')
            .setLabel('Leave')
            .setStyle(ButtonStyle.Danger),
        ),
    ],
  };
}

export async function cooperativeLeaveButton(
  interaction:ButtonInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
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
        title: 'You have left the cooperative!',
      }),
    ],
  });
}

async function add(
  interaction:ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions> {
  if (interaction.user.id !== env.DISCORD_OWNER_ID) {
    return {
      embeds: [
        embedTemplate({
          title: 'This action is restricted!',
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
        title: `I added ${guild.name} to the cooperation`,
      }),
    ],
  };
}

async function remove(
  interaction:ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions> {
  if (interaction.user.id !== env.DISCORD_OWNER_ID) {
    return {
      embeds: [
        embedTemplate({
          title: 'This action is restricted!',
        }),
      ],
    };
  }

  // Sets the guild cooperative status to false
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
        title: `I removed ${guild.name} from the cooperation`,
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
    .setName('cooperative')
    .setDescription('TripSit Discord Cooperative Commands')
    .addSubcommand(subcommand => subcommand
      .setDescription('Help for the TripSit Discord Cooperative Commands')
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Apply to join the TripSit Discord Cooperative')
      .setName('apply'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Setup the TripSit Discord Cooperative on your guild')
      .addChannelOption(option => option
        .setRequired(true)
        .setDescription('The channel to use for moderation')
        .setName('mod_channel'))
      .addChannelOption(option => option
        .setRequired(true)
        .setDescription('The channel to use for moderation logs')
        .setName('modlog_channel'))
      .addRoleOption(option => option
        .setRequired(true)
        .setDescription('The role to use for moderators')
        .setName('mod_role'))
      .addChannelOption(option => option
        .setRequired(true)
        .setDescription('The channel to use for moderation tickets')
        .setName('helpdesk_channel'))
      .addChannelOption(option => option
        .setRequired(true)
        .setDescription('The channel to use for trust logging')
        .setName('trust_channel'))
      .addIntegerOption(option => option
        .setRequired(true)
        .setDescription('Below this number sends alerts')
        .setName('trust_score_limit'))
      .setName('setup'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Leave the TripSit Discord Cooperative')
      .setName('leave'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Add a guild to the TripSit Discord Cooperative')
      .addStringOption(option => option
        .setName('guild_id')
        .setDescription('The ID of the guild to add')
        .setRequired(true))
      .setName('add'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Remove a guild from the TripSit Discord Cooperative')
      .setName('remove')
      .addStringOption(option => option
        .setName('guild_id')
        .setDescription('The ID of the guild to remove')
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.guild) {
      await interaction.editReply({
        embeds: [
          embedTemplate({
            title: guildOnlyError,
          }),
        ],
      });
      return false;
    }

    let response = {} as InteractionEditReplyOptions;
    const command = interaction.options.getSubcommand();
    switch (command) {
      case 'info':
        response = await info();
        break;
      case 'apply':
        response = await apply(interaction);
        break;
      case 'setup':
        response = await setup(interaction);
        break;
      case 'leave':
        response = await leave(interaction);
        break;
      case 'add':
        response = await add(interaction);
        break;
      case 'remove':
        response = await remove(interaction);
        break;
      default:
        break;
    }

    await interaction.editReply(response);
    return true;
  },
};

export default dCooperative;
