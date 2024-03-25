/* eslint-disable @typescript-eslint/no-use-before-define */
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
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  AnySelectMenuInteraction,
  PermissionFlagsBits,
  GuildMember,
  ChannelSelectMenuInteraction,
  RoleSelectMenuInteraction,
  GuildTextBasedChannel,
} from 'discord.js';
import {
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndent, stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';
import commandContext from '../../utils/context';

const F = f(__filename);

const tempSettings:{
  [key:string]:{ // Discord ID
    modChannel?: string;
    modRole?: string;
    modLogChannel?: string;
    helpdeskChannel?: string;
    trustChannel?: string;
    trustScoreLimit?: number;
  }
} = {};

namespace type {
  export type CooperativeInteraction =
  ChatInputCommandInteraction
  | ButtonInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction;

  export enum Button {
    infoPage = 'infoPage',
    setupPageOne = 'setupPageOne',
    setupPageTwo = 'setupPageTwo',
    setupPageThree = 'setupPageThree',
    save = 'save',
  }

  export enum Menu {
    modChannel = 'modChannel',
    modlLogChannel = 'modlLogChannel',
    modRole = 'modRole',
    helpdeskChannel = 'helpdeskChannel',
    trustChannel = 'trustChannel',
    trustScoreLimit = 'trustScoreLimit',
  }

  export enum SetupPage {
    setupPageOne = 'setupPageOne',
    setupPageTwo = 'setupPageTwo',
    setupPageThree = 'setupPageThree',
  }

  export enum NavPage {
    infoPage = 'infoPage',
    setupPage = 'setupPageOne',
  }
}
namespace text {
  export function guildOnly() {
    return 'This command can only be used in a guild.';
  }
}

namespace util {
  export async function navMenu(
    page: type.NavPage,
  ):Promise<ActionRowBuilder<ButtonBuilder>> {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        button.infoPage().setStyle(page === type.NavPage.infoPage ? ButtonStyle.Success : ButtonStyle.Primary),
        button.setupPage().setStyle(page === type.NavPage.setupPage ? ButtonStyle.Success : ButtonStyle.Primary),
      );
  }

  export async function info(): Promise<InteractionEditReplyOptions> {
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

  export async function apply(interaction:ChatInputCommandInteraction): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild) {
      return {
        embeds: [
          embedTemplate({
            title: text.guildOnly(),
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

  export async function setup(interaction:ChatInputCommandInteraction):Promise<InteractionEditReplyOptions> {
    if (!interaction.guild) {
      return {
        embeds: [
          embedTemplate({
            title: text.guildOnly(),
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
            title: text.guildOnly(),
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

  export async function leave(interaction:ChatInputCommandInteraction): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild) {
      return {
        embeds: [
          embedTemplate({
            title: text.guildOnly(),
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

  export async function add(
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

  export async function remove(
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
}

namespace page {
  export async function info(
    interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    // Pages can be activated by a command, a button, or a select menu, basically any embed interaction
    // We return the Interaction Edit Reply Options so that each interaction handler can return in the expected way:
    // IE: Slash commands use an .editReply() method, buttons and select menus use an .update() method
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };
    log.info(F, await commandContext(interaction));

    return {
      embeds: [
        embedTemplate()
          .setTitle('Template Page One')
          .setDescription(stripIndents`
            This is a first page

          `),
      ],
      components: [
        await util.navMenu(type.NavPage.infoPage),
      ],
    };
  }

  export async function setup(
    interaction: type.CooperativeInteraction,
    pageName: type.SetupPage,
  ): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };
    log.info(F, await commandContext(interaction));
    const S = 'setupMenu';

    const setupMenuRow = new ActionRowBuilder<ButtonBuilder>();

    setupMenuRow.addComponents(
      button.setupPageOne().setStyle(pageName === 'setupPageOne' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.setupPageTwo().setStyle(pageName === 'setupPageTwo' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.setupPageThree().setStyle(pageName === 'setupPageThree' ? ButtonStyle.Success : ButtonStyle.Primary),
    );

    const setupRows: ActionRowBuilder<
    ButtonBuilder
    | ChannelSelectMenuBuilder
    | RoleSelectMenuBuilder >[] = [setupMenuRow];

    // Only show the save button if the user has the Manage Channels permission
    // And all of the required setup options are set correctly
    // Otherwise, they can still view the setup options
    if ((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels)) {
      const failedPermissions:string[] = [];

      failedPermissions.push(...(await validate.tripsitChannel(interaction)));
      failedPermissions.push(...(await validate.tripsitterRoles(interaction)));
      failedPermissions.push(...(await validate.metaChannel(interaction)));
      failedPermissions.push(...(await validate.giveRemoveRoles(interaction)));
      failedPermissions.push(...(await validate.logChannel(interaction)));

      if (failedPermissions.length === 0) {
        setupMenuRow.addComponents(
          button.save().setStyle(ButtonStyle.Danger),
        );
      }
    }

    switch (pageName) {
      case type.SetupPage.setupPageOne:
        setupRows.push(
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.tripsitChannel
              ? select.tripsitChannel().setDefaultChannels(setupOptions.tripsitChannel)
              : select.tripsitChannel(),
          ),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.tripsitterRoles
              ? select.tripsitterRoles().setDefaultRoles(setupOptions.tripsitterRoles)
              : select.tripsitterRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.metaChannel
              ? select.metaChannel().setDefaultChannels(setupOptions.metaChannel)
              : select.metaChannel(),
          ),
        );
        break;
      case 'setupPageTwo':
        setupRows.push(
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.givingRoles
              ? select.givingRoles().setDefaultRoles(setupOptions.givingRoles)
              : select.givingRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.removingRoles
              ? select.removingRoles().setDefaultRoles(setupOptions.removingRoles)
              : select.removingRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.logChannel
              ? select.logChannel().setDefaultChannels(setupOptions.logChannel)
              : select.logChannel().setDefaultChannels(),
          ),
        );
        break;
      case 'setupPageThree':
        setupRows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
          button.updateEmbed(),
        ));
        break;
      default:
        break;
    }

    // This should only ever return 4 rows, because 1 of the 5 rows will be the navigation array
    if (setupRows.length > 4) {
      log.error(F, `${S} setupRows has more than 4 rows! ${setupRows.length}`);
      throw new Error('setupRows has more than 4 rows!');
    }

    // .addChannelOption(option => option
    //   .setRequired(true)
    //   .setDescription('The channel to use for moderation')
    //   .setName('mod_channel'))
    // .addChannelOption(option => option
    //   .setRequired(true)
    //   .setDescription('The channel to use for moderation logs')
    //   .setName('modlog_channel'))
    // .addRoleOption(option => option
    //   .setRequired(true)
    //   .setDescription('The role to use for moderators')
    //   .setName('mod_role'))
    // .addChannelOption(option => option
    //   .setRequired(true)
    //   .setDescription('The channel to use for moderation tickets')
    //   .setName('helpdesk_channel'))
    // .addChannelOption(option => option
    //   .setRequired(true)
    //   .setDescription('The channel to use for trust logging')
    //   .setName('trust_channel'))
    // .addIntegerOption(option => option
    //   .setRequired(true)
    //   .setDescription('Below this number sends alerts')
    //   .setName('trust_score_limit'))

    // .addSubcommand(subcommand => subcommand
    //   .setDescription('Leave the TripSit Discord Cooperative')
    //   .setName('leave'))

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle('Cooperative Setup')
          .setDescription(stripIndents`
            ### Moderator Channel
            ${tempSettings[interaction.user.id]?.modChannel ?? 'None'}
            ### Moderator Role
            ${tempSettings[interaction.user.id]?.modRole ?? 'None'}
            ### Moderator Log Channel 
            ${tempSettings[interaction.user.id]?.modLogChannel ?? 'None'}
            ### Helpdesk Channel
            ${tempSettings[interaction.user.id]?.helpdeskChannel ?? 'None'}
            ### Trust Log Channel
            ${tempSettings[interaction.user.id]?.trustChannel ?? 'None'}
            ### Trust Score Limit
            ${tempSettings[interaction.user.id]?.trustScoreLimit ?? 'None'}
          `),
      ],
      components: [
        await util.navMenu(type.NavPage.setupPage),
      ],
    };
  }
}

namespace button {
  export function infoPage() {
    return new ButtonBuilder()
      .setCustomId(`cooperative~${type.Button.infoPage}`)
      .setLabel('Info')
      .setEmoji('ℹ️')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPage() {
    return new ButtonBuilder()
      .setCustomId(`cooperative~${type.Button.setupPageOne}`)
      .setLabel('Setup')
      .setEmoji('🛠️')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageOne() {
    return new ButtonBuilder()
      .setCustomId(`cooperative~${type.Button.setupPageOne}`)
      .setLabel('Page One')
      .setEmoji('1️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageTwo() {
    return new ButtonBuilder()
      .setCustomId(`cooperative~${type.Button.setupPageTwo}`)
      .setLabel('Page Two')
      .setEmoji('2️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageThree() {
    return new ButtonBuilder()
      .setCustomId(`cooperative~${type.Button.setupPageThree}`)
      .setLabel('Page Three')
      .setEmoji('3️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function save() {
    return new ButtonBuilder()
      .setCustomId('tripsit~save')
      .setLabel('Save')
      .setEmoji('💾')
      .setStyle(ButtonStyle.Success);
  }

  export function textInput() {
    return new ButtonBuilder()
      .setCustomId(`cooperative~${type.Button.textInput}`)
      .setLabel('Text')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Primary);
  }
}

namespace select {
  export function channel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId(`cooperative~${type.Menu.channel}`)
      .setPlaceholder('Channel')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function role() {
    return new RoleSelectMenuBuilder()
      .setCustomId(`cooperative~${type.Menu.role}`)
      .setPlaceholder('Role')
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function user() {
    return new UserSelectMenuBuilder()
      .setCustomId(`cooperative~${type.Menu.user}`)
      .setPlaceholder('User')
      .setMinValues(0)
      .setMaxValues(1);
  }
}

namespace validate {
  export async function modChannel(
    interaction: type.CooperativeInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];

    const channelId = tempSettings[interaction.user.id].modChannel;
    if (!channelId) return ['\n\n**⚠️ No TripSit Channel set! ⚠️**'];

    const channel = await interaction.guild.channels.fetch(channelId);
    if (!channel) return ['\n\n**⚠️ TripSit Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.modChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { tripsit_channel: undefined },
    //     });interaction.guild.channels.cache.get(c
    //   }
    //   return ['Tripsit channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function moderatorRole(
    interaction: type.CooperativeInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];

    const S = 'tripsitterRoles';

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const roleIds = sessionData.tripsitterRoles;
    if (!roleIds) return ['\n**⚠️ No Tripsitter Roles set, I wont be able to invite people to private threads! ⚠️**'];

    const roleCheck = await Promise.all(roleIds.map(async roleId => {
      if (!interaction.guild) return text.guildOnly();
      // For each of the tripsitter roles, validate:

      // The role exists
      const role = await interaction.guild?.roles.fetch(roleId);
      if (!role) return `\n**⚠️ ${role} not found, try again with another role! ⚠️**`;

      // Check that the role is mentionable by the bot
      if (!role.mentionable) {
        // If the role isn't mentionable, double check that the bot doesn't have the permission to mention everyone
        const perms = await checkGuildPermissions(interaction.guild, permissionList.mentionEveryone);
        if (perms.length > 0) {
          return `\n**⚠️ The ${role} isn't mentionable, and I don't have the permission to mention them! ⚠️**`;
        }
        log.debug(F, `[${S}] The ${role} isn't mentionable, but I have the permission to mention hidden roles!`);
      }

      return undefined;
    }));

    const filteredResults = roleCheck.filter(role => role !== undefined);

    // log.debug(F, `[${S}] filteredResults: ${filteredResults}`);

    return filteredResults as string[];
  }

  export async function modLogChannel(
    interaction: type.CooperativeInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].logChannel;
    if (!channelId) return [];

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ Log Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.logChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { log_channel: undefined },
    //     });
    //   }
    //   return ['Log channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function helpdeskChannel(
    interaction: type.CooperativeInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].metaChannel;
    if (!channelId) return []; // Meta channel is optional

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ Meta Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.metaChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { metaChannel: undefined },
    //     });
    //   }
    //   return ['Tripsit meta channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function trustChannel(
    interaction: type.CooperativeInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].metaChannel;
    if (!channelId) return []; // Meta channel is optional

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ Meta Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.metaChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { metaChannel: undefined },
    //     });
    //   }
    //   return ['Tripsit meta channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }
}

namespace permissionList {
  export const guildPermissions:PermissionResolvable[] = [
    'ManageRoles',
  ];
  export const modChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'SendMessagesInThreads',
    'CreatePrivateThreads',
    // 'ManageMessages',
    // 'ManageThreads',
  ];
  export const metaChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'SendMessagesInThreads',
    'CreatePrivateThreads',
    'ManageThreads',
  ];
  export const logChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
  ];

  export const mentionEveryone:PermissionResolvable[] = [
    'MentionEveryone',
  ];

  export const manageThreads:PermissionResolvable[] = [
    'SendMessages',
    'ManageThreads',
  ];
}

// The only functions we export are those that are used in the event handlers
export async function cooperativeSelect(
  interaction: AnySelectMenuInteraction,
): Promise<void> {
  // Used in selectMenu.ts
  // You must add the following to the selectMenu.ts file
  // if (menuID.startsWith('coop')) {
  //   await cooperativeSelect(interaction);
  // }
  if (!interaction.guild) return;
  const menuId = interaction.customId;
  const [, menuAction] = menuId.split('~') as [null, type.Menu ];

  // log.debug(F, `[${S}] tempSettings: ${JSON.stringify(tempSettings, null, 2)}`);

  switch (menuAction) {
    case 'channel': {
      tempSettings[interaction.user.id] = {
        ...tempSettings[interaction.user.id],
        channel: interaction.values[0],
      };
      break;
    }
    case 'role': {
      tempSettings[interaction.user.id] = {
        ...tempSettings[interaction.user.id],
        role: interaction.values[0],
      };
      break;
    }
    case 'user': {
      tempSettings[interaction.user.id] = {
        ...tempSettings[interaction.user.id],
        user: interaction.values[0],
      };
      break;
    }
    default:
      break;
  }

  await interaction.update(await page.setup(interaction));
}

export async function cooperativeButton(
  interaction: ButtonInteraction,
): Promise<void> {
  // Used in buttonClick.ts
  // You must add the following to the buttonClick.ts file
  // if (buttonID.startsWith('coop')) {
  //   await cooperativeButton(interaction);
  // }
  const buttonID = interaction.customId;
  const [, action] = buttonID.split('~') as [null, type.Button];

  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (action) {
    case 'infoPage':
      await interaction.update(await page.info(interaction));
      break;
    case 'setupPageOne':
      await interaction.update(await page.setup(interaction, type.SetupPage.setupPageOne));
      break;
    case 'setupPageTwo':
      await interaction.update(await page.setup(interaction, type.SetupPage.setupPageTwo));
      break;
    case 'setupPageThree':
      await interaction.update(await page.setup(interaction, type.SetupPage.setupPageThree));
      break;
    case 'save':
      await interaction.update(await page.save(interaction));
      break;
    default:
      break;
  }
}

export const dCooperative: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('cooperative')
    .setDescription('TripSit Discord Cooperative'),
  async execute(interaction) {
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(await page.info(interaction));
    return true;
  },
};

export default dCooperative;
