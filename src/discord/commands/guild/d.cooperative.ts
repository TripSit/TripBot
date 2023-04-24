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
} from 'discord.js';
import {
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { database } from '../../../global/utils/knex';
import { checkGuildPermissions } from '../../utils/checkPermissions';

const F = f(__filename);

async function setup():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate({
        title: 'Cooperative Setup',
        description: stripIndents`
        This command will set up your guild when you first join the cooperative.
        It will perform the following tasks:
        * Create a category called 'Cooperative'
        - This category will be used to store all cooperative channels.
        * Create a channel called '#coop-mod'
        - This channel will be used for cooperative moderation.
        - Ban messages will be sent here when you ban someone for the rest of the cooperative to see
        - You can reach out to other guilds through this channel to clarify bans.
        * Create a channel called '#modlog'
        - This will be used to track moderation actions *by your own team* and to keep them accountable.
        - Only ban alerts/messages are sent to #coop-mod for other guilds to see.
        - Other guilds can see how many warnings/timeouts, but not the reason/who did it.
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
        `,
      }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()

        .addComponents(
          new ButtonBuilder()
            .setCustomId('cooperativeSetup')
            .setLabel('Setup')
            .setStyle(ButtonStyle.Primary),
        ),
    ],
  };
}

export async function cooperativeSetupButton(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  const perms = await checkGuildPermissions(interaction.guild, [
    'ViewAuditLog' as PermissionResolvable,
  ]);

  if (!perms.hasPermission) {
    const guildOwner = await interaction.guild.fetchOwner();
    await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${interaction.guild} so I can run ${F}!` }); // eslint-disable-line
    log.error(F, `Missing permission ${perms.permission} in ${interaction.guild}!`);
    return;
  }

  await interaction.editReply({
    embeds: [
      embedTemplate({
        title: 'Cooperative setup complete!',
        description: stripIndents`Thanks!`,
      }),
    ],
  });
}

async function info(): Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate({
        title: 'TripSit Discord Cooperative Info',
        description: 'Here is a list of all the regulations for the TripSit Discord Cooperative:',
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

async function apply(): Promise<InteractionEditReplyOptions> {
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

async function leave(): Promise<InteractionEditReplyOptions> {
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
  const guildData = await database.guilds.get(guild.id);
  guildData.partner = false;
  await database.guilds.set(guildData);
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
  const guild = await discordClient.guilds.fetch(interaction.options.getString('guildId', true));
  const guildData = await database.guilds.get(guild.id);
  guildData.partner = true;
  await database.guilds.set(guildData);
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
  // Sets the guild partner status to false
  const guild = await discordClient.guilds.fetch(interaction.options.getString('guildId', true));
  const guildData = await database.guilds.get(guild.id);
  guildData.partner = false;
  await database.guilds.set(guildData);
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
  // const channelComMod = await discordClient.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
  // For each Id in pingGuilds, look up the guild in the database and get the channel id of their community mod room,
  // and the ID of their moderator role. Then send the message to that channel, pinging those moderators. This is unique
  // for each guild so that each guild gets a custom ping if they're in the array.

  await Promise.all(pingGuilds.map(async guildId => {
    const guildData = await database.guilds.get(guildId);
    const guild = await discordClient.guilds.fetch(guildId);
    if (guildData.mod_room_id && guildData.mod_role_id) {
      let channelCoopMod = {} as TextChannel;
      try {
        channelCoopMod = await discordClient.channels.fetch(guildData.mod_room_id) as TextChannel;
      } catch (e) {
        guildData.mod_room_id = null;
        await database.guilds.set(guildData);
      }

      let roleMod = {} as Role;
      try {
        roleMod = await guild.roles.fetch(guildData.mod_role_id) as Role;
      } catch (e) {
        guildData.mod_room_id = null;
        await database.guilds.set(guildData);
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
      .setName('setup'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Leave the TripSit Discord Cooperative')
      .setName('leave'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Add a guild to the TripSit Discord Cooperative')
      .setName('add')
      .addStringOption(option => option
        .setName('guild_id')
        .setDescription('The ID of the guild to add')
        .setRequired(true)))
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
            title: 'This command can only be used in a guild!',
          }),
        ],
      });
      return false;
    }

    let response = {} as InteractionEditReplyOptions;

    const command = interaction.options.getSubcommand();
    const guildData = await database.guilds.get(interaction.guild.id);
    if ((command === 'leave' || command === 'setup') && !guildData.partner) {
      await interaction.editReply({
        embeds: [
          embedTemplate({
            title: 'You are not part of the cooperative!',
          }),
        ],
      });
      return false;
    }

    if (command === 'apply' && !guildData.partner) {
      await interaction.editReply({
        embeds: [
          embedTemplate({
            title: 'You are already part of the cooperative!',
          }),
        ],
      });
      return false;
    }

    if ((command === 'add' || command === 'remove') && interaction.guild.id !== env.DISCORD_GUILD_ID) {
      await interaction.editReply({
        embeds: [
          embedTemplate({
            title: 'This action is restricted!',
          }),
        ],
      });
      return false;
    }

    if (command === 'info') response = await info();
    else if (command === 'apply') response = await apply();
    else if (command === 'setup') response = await setup();
    else if (command === 'leave') response = await leave();
    else if (command === 'add') response = await add(interaction);
    else if (command === 'remove') response = await remove(interaction);

    await interaction.editReply(response);
    return true;
  },
};

export default dCooperative;
