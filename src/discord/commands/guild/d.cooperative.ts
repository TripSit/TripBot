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
  AnySelectMenuInteraction,
  ChannelSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  Guild,
  GuildMember,
  EmbedBuilder,
  TextChannel,
  Role,
  PermissionResolvable,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import {
  ButtonStyle,
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndent, stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkGuildPermissions, checkChannelPermissions } from '../../utils/checkPermissions';
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
      await i.deferReply({ flags: MessageFlags.Ephemeral });

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

type CooperativeSettings = {
  modChannel?: string;
  modLogChannel?: string;
  modRole?: string;
  helpdeskChannel?: string;
  trustChannel?: string;
  trustScoreLimit?: number;
};

type SetupPage = 'setupPageOne' | 'setupPageTwo';

type SetupInteraction =
  ChatInputCommandInteraction
  | ButtonInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction;

// Per-user, in-memory draft of a guild's cooperative settings while they work through the wizard.
const tempSettings: { [userId: string]: CooperativeSettings } = {};

const permissionList = {
  modChannel: [
    'ViewChannel', 'SendMessages', 'SendMessagesInThreads', 'CreatePrivateThreads',
  ] as PermissionResolvable[],
  logChannel: ['ViewChannel', 'SendMessages'] as PermissionResolvable[],
};

async function loadSettings(userId: string, guildId: string): Promise<CooperativeSettings> {
  if (!tempSettings[userId]) {
    const guildData = await db.discord_guilds.upsert({
      where: { id: guildId },
      create: { id: guildId },
      update: {},
    });
    tempSettings[userId] = {
      modChannel: guildData.channel_moderators ?? undefined,
      modLogChannel: guildData.channel_mod_log ?? undefined,
      modRole: guildData.role_moderator ?? undefined,
      helpdeskChannel: guildData.channel_helpdesk ?? undefined,
      trustChannel: guildData.channel_trust ?? undefined,
      trustScoreLimit: guildData.trust_score_limit,
    };
  }
  return tempSettings[userId];
}

async function validateChannel(
  guild: Guild,
  channelId: string | undefined,
  perms: PermissionResolvable[],
): Promise<string | null> {
  if (!channelId) return null; // Unset is fine, it'll be auto-created on save.
  let channel;
  try {
    channel = await guild.channels.fetch(channelId);
  } catch {
    return null; // Stale id pointing at a deleted channel, it'll be recreated on save.
  }
  if (!channel) return null;
  const result = await checkChannelPermissions(channel, perms);
  if (!result.hasPermission) return `Missing **${result.permission}** in <#${channelId}>.`;
  return null;
}

async function validateModRole(guild: Guild, roleId: string | undefined): Promise<string | null> {
  if (!roleId) return null;
  let role;
  try {
    role = await guild.roles.fetch(roleId);
  } catch {
    return null;
  }
  if (!role) return null;
  if (!role.mentionable) {
    const result = await checkGuildPermissions(guild, ['MentionEveryone' as PermissionResolvable]);
    if (!result.hasPermission) return `${role} isn't mentionable and I lack **MentionEveryone**.`;
  }
  return null;
}

function channelSelect(customId: string, placeholder: string, current?: string) {
  const select = new ChannelSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1);
  return current ? select.setDefaultChannels(current) : select;
}

function roleSelect(customId: string, placeholder: string, current?: string) {
  const select = new RoleSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(1);
  return current ? select.setDefaultRoles(current) : select;
}

function navRow(page: SetupPage, canSave: boolean) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('cooperative~setupPageOne')
      .setLabel('Channels')
      .setEmoji('1️⃣')
      .setStyle(page === 'setupPageOne' ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('cooperative~setupPageTwo')
      .setLabel('Role & Trust')
      .setEmoji('2️⃣')
      .setStyle(page === 'setupPageTwo' ? ButtonStyle.Success : ButtonStyle.Primary),
  );
  if (canSave) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('cooperative~save')
        .setLabel('Save')
        .setEmoji('💾')
        .setStyle(ButtonStyle.Danger),
    );
  }
  return row;
}

const notSetLabel = '*Not set — will be auto-created*';

function settingsSummary(settings: CooperativeSettings): string {
  return stripIndents`
    ### Mod Channel
    ${settings.modChannel ? `<#${settings.modChannel}>` : notSetLabel}
    ### Mod Log Channel
    ${settings.modLogChannel ? `<#${settings.modLogChannel}>` : notSetLabel}
    ### Helpdesk Channel
    ${settings.helpdeskChannel ? `<#${settings.helpdeskChannel}>` : notSetLabel}
    ### Mod Role
    ${settings.modRole ? `<@&${settings.modRole}>` : notSetLabel}
    ### Trust Channel
    ${settings.trustChannel ? `<#${settings.trustChannel}>` : notSetLabel}
    ### Trust Score Limit
    ${settings.trustScoreLimit ?? 5}
  `;
}

async function setupWizard(
  interaction: SetupInteraction,
  page: SetupPage,
): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild || !interaction.member) {
    return { embeds: [embedTemplate({ title: guildOnlyError })] };
  }
  const guild = interaction.guild as Guild;

  const settings = await loadSettings(interaction.user.id, guild.id);
  const canEdit = (interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels);

  if (!canEdit) {
    const readOnlyNotice = '*You need the **Manage Channels** permission to edit these settings.*';
    return {
      embeds: [
        embedTemplate({
          title: 'Cooperative Setup',
          description: `${settingsSummary(settings)}\n${readOnlyNotice}`,
        }),
      ],
      components: [],
    };
  }

  const validations = await Promise.all([
    validateChannel(guild, settings.modChannel, permissionList.modChannel),
    validateChannel(guild, settings.modLogChannel, permissionList.logChannel),
    validateChannel(guild, settings.helpdeskChannel, permissionList.logChannel),
    validateChannel(guild, settings.trustChannel, permissionList.logChannel),
    validateModRole(guild, settings.modRole),
  ]);
  const warnings = validations.filter((warning): warning is string => warning !== null);

  const rows: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | RoleSelectMenuBuilder>[] = [
    navRow(page, warnings.length === 0),
  ];

  if (page === 'setupPageOne') {
    rows.push(
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        channelSelect('cooperative~modChannel', 'Mod Channel', settings.modChannel),
      ),
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        channelSelect('cooperative~modLogChannel', 'Mod Log Channel', settings.modLogChannel),
      ),
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        channelSelect('cooperative~helpdeskChannel', 'Helpdesk Channel', settings.helpdeskChannel),
      ),
    );
  } else {
    rows.push(
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
        roleSelect('cooperative~modRole', 'Mod Role', settings.modRole),
      ),
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        channelSelect('cooperative~trustChannel', 'Trust Channel', settings.trustChannel),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('cooperative~trustScoreButton')
          .setLabel(`Trust Score Limit: ${settings.trustScoreLimit ?? 5}`)
          .setEmoji('🔢')
          .setStyle(ButtonStyle.Secondary),
      ),
    );
  }

  const readyNotice = 'Pick a channel/role for each field, or leave one unset and I\'ll create '
    + 'a sensible default for it when you hit **Save**.';
  const warningsList = warnings.map(warning => `- ${warning}`).join('\n');
  const description = warnings.length > 0
    ? `${settingsSummary(settings)}\n**⚠️ Fix these before saving:**\n${warningsList}`
    : `${settingsSummary(settings)}\n${readyNotice}`;

  return {
    embeds: [embedTemplate({ title: 'Cooperative Setup', description })],
    components: rows,
  };
}

async function trustScoreModal(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;
  const settings = await loadSettings(interaction.user.id, interaction.guild.id);
  const customId = `cooperative~trustScoreModal~${interaction.id}`;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(customId)
    .setTitle('Set Trust Score Limit')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('trustScoreLimit')
          .setLabel('Below this trust score, alerts fire')
          .setStyle(TextInputStyle.Short)
          .setValue(String(settings.trustScoreLimit ?? 5))
          .setRequired(true),
      ),
    ));

  const filter = (i: ModalSubmitInteraction) => i.customId === customId;
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      await i.deferUpdate();
      const raw = i.fields.getTextInputValue('trustScoreLimit');
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed < 0) {
        await i.followUp({ content: 'Please enter a whole, non-negative number.', flags: MessageFlags.Ephemeral });
        return;
      }
      tempSettings[interaction.user.id] = { ...tempSettings[interaction.user.id], trustScoreLimit: parsed };
      await i.editReply(await setupWizard(interaction, 'setupPageTwo'));
    })
    .catch(() => {
      // The user closed the modal without submitting, nothing to do.
    });
}

async function resolveOrCreateChannel(
  guild: Guild,
  channelId: string | undefined,
  channelOptions: { name: string; topic: string },
): Promise<TextChannel> {
  if (channelId) {
    try {
      const existing = await guild.channels.fetch(channelId);
      if (existing) return existing as TextChannel;
    } catch {
      // Stale id, fall through and create a fresh channel.
    }
  }
  return guild.channels.create({
    name: channelOptions.name,
    type: ChannelType.GuildText,
    topic: channelOptions.topic,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: ['ViewChannel'],
      },
    ],
  });
}

async function resolveOrCreateModRole(guild: Guild, roleId: string | undefined): Promise<Role> {
  if (roleId) {
    try {
      const existing = await guild.roles.fetch(roleId);
      if (existing) return existing;
    } catch {
      // Stale id, fall through and create a fresh role.
    }
  }
  return guild.roles.create({
    name: 'Cooperative Moderator',
    color: '#00ff00',
    mentionable: true,
  });
}

async function save(interaction: ButtonInteraction): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) return { embeds: [embedTemplate({ title: guildOnlyError })] };
  const guild = interaction.guild as Guild;
  const settings = tempSettings[interaction.user.id] ?? {};

  const [modChannel, modLogChannel, helpdeskChannel, trustChannel, modRole] = await Promise.all([
    resolveOrCreateChannel(guild, settings.modChannel, {
      name: 'coop-mod',
      topic: 'This channel is used for cooperative moderation.',
    }),
    resolveOrCreateChannel(guild, settings.modLogChannel, {
      name: 'modlog',
      topic: 'This channel is used for moderation logs.',
    }),
    resolveOrCreateChannel(guild, settings.helpdeskChannel, {
      name: '🙊│talk-to-mods',
      topic: 'This channel is used to make tickets.',
    }),
    resolveOrCreateChannel(guild, settings.trustChannel, {
      name: '🔒│trust-log',
      topic: 'This channel is used to oversee the trust logging.',
    }),
    resolveOrCreateModRole(guild, settings.modRole),
  ]);
  const trustScoreLimit = settings.trustScoreLimit ?? 5;

  await db.discord_guilds.update({
    where: { id: guild.id },
    data: {
      channel_moderators: modChannel.id,
      channel_mod_log: modLogChannel.id,
      channel_helpdesk: helpdeskChannel.id,
      channel_trust: trustChannel.id,
      role_moderator: modRole.id,
      trust_score_limit: trustScoreLimit,
    },
  });

  delete tempSettings[interaction.user.id];

  return {
    embeds: [
      embedTemplate({
        title: 'Cooperative setup complete!',
        description: stripIndents`
        Mod Channel: ${modChannel}
        Mod Log Channel: ${modLogChannel}
        Helpdesk Channel: ${helpdeskChannel}
        Mod Role: ${modRole}
        Trust Channel: ${trustChannel}
        Trust Score Limit: ${trustScoreLimit}`,
      }),
    ],
    components: [],
  };
}

async function setupEntry(interaction: ChatInputCommandInteraction): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return { embeds: [embedTemplate({ title: guildOnlyError })] };
  }

  const guildData = await db.discord_guilds.upsert({
    where: { id: interaction.guild.id },
    create: { id: interaction.guild.id },
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

  const perms = await checkGuildPermissions(interaction.guild, [
    'ManageChannels', 'ManageRoles', 'ViewAuditLog',
  ] as PermissionResolvable[]);

  if (!perms.hasPermission) {
    log.error(F, `Missing permission ${perms.permission} in ${interaction.guild}!`);
    return { content: `Please make sure I can **${perms.permission}** in this guild so I can run cooperative setup!` };
  }

  // Start each /cooperative setup invocation from a fresh, DB-hydrated draft.
  delete tempSettings[interaction.user.id];
  return setupWizard(interaction, 'setupPageOne');
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

export async function cooperativeButton(interaction: ButtonInteraction): Promise<void> {
  const buttonID = interaction.customId;

  if (buttonID === 'cooperativeApply') {
    await cooperativeApplyButton(interaction);
    return;
  }
  if (buttonID === 'cooperativeLeave') {
    await cooperativeLeaveButton(interaction);
    return;
  }

  if (!interaction.guild || !interaction.member) return;

  const [, action] = buttonID.split('~');

  switch (action) {
    case 'setupPageOne':
      await interaction.update(await setupWizard(interaction, 'setupPageOne'));
      break;
    case 'setupPageTwo':
      await interaction.update(await setupWizard(interaction, 'setupPageTwo'));
      break;
    case 'trustScoreButton':
      await trustScoreModal(interaction);
      break;
    case 'save':
      await interaction.update(await save(interaction));
      break;
    default:
      break;
  }
}

export async function cooperativeSelect(interaction: AnySelectMenuInteraction): Promise<void> {
  if (!interaction.guild) return;
  if (!interaction.isChannelSelectMenu() && !interaction.isRoleSelectMenu()) return;

  const [, field] = interaction.customId.split('~') as [string, keyof CooperativeSettings];
  const settings = await loadSettings(interaction.user.id, interaction.guild.id);
  const page: SetupPage = (field === 'modRole' || field === 'trustChannel') ? 'setupPageTwo' : 'setupPageOne';

  tempSettings[interaction.user.id] = {
    ...settings,
    [field]: interaction.values[0],
  };

  await interaction.update(await setupWizard(interaction, page));
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
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setDescription('Help for the TripSit Discord Cooperative Commands')
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Apply to join the TripSit Discord Cooperative')
      .setName('apply'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Setup the TripSit Discord Cooperative on your guild')
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
        response = await setupEntry(interaction);
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
