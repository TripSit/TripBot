import {
  GuildMember,
  Role,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';

const F = f(__filename);

export default dRole;

type RoleDef = { name: string; value: string };

const colorRoles = [
  { name: '💖 Tuplp', value: env.ROLE_RED },
  { name: '🧡 Marigold', value: env.ROLE_ORANGE },
  { name: '💛 Daffodil', value: env.ROLE_YELLOW },
  { name: '💚 Waterlily', value: env.ROLE_GREEN },
  { name: '💙 Bluebell', value: env.ROLE_BLUE },
  { name: '💜 Hyacinth', value: env.ROLE_PURPLE },
  { name: '💗 Azalea', value: env.ROLE_PINK },
] as RoleDef[];

// log.debug(F, `Color roles: ${JSON.stringify(colorRoles, null, 2)}`);
// const colorNames = colorRoles.map(role => role.name);
const colorIds = colorRoles.map(role => role.value);

const premiumColorRoles = [
  { name: '💖 Red', value: env.ROLE_DONOR_RED },
  { name: '🧡 Orange', value: env.ROLE_DONOR_ORANGE },
  { name: '💛 Yellow', value: env.ROLE_DONOR_YELLOW },
  { name: '💚 Green', value: env.ROLE_DONOR_GREEN },
  { name: '💙 Blue', value: env.ROLE_DONOR_BLUE },
  { name: '💜 Purple', value: env.ROLE_DONOR_PURPLE },
  { name: '💗 Pink', value: env.ROLE_DONOR_PINK },
] as RoleDef[];

// log.debug(F, `Premium Color roles: ${JSON.stringify(premiumColorRoles, null, 2)}`);
// const premiumColorNames = premiumColorRoles.map(role => role.name);
const premiumColorIds = premiumColorRoles.map(role => role.value);

const mindsetRoles = [
  { name: 'Drunk', value: env.ROLE_DRUNK },
  { name: 'High', value: env.ROLE_HIGH },
  { name: 'Rolling', value: env.ROLE_ROLLING },
  { name: 'Tripping', value: env.ROLE_TRIPPING },
  { name: 'Dissociating', value: env.ROLE_DISSOCIATING },
  { name: 'Stimming', value: env.ROLE_STIMMING },
  { name: 'Sedated', value: env.ROLE_SEDATED },
  { name: 'Sober', value: env.ROLE_SOBER },
] as RoleDef[];

// log.debug(F, `Mindset roles: ${JSON.stringify(mindsetRoles, null, 2)}`);
// const mindsetNames = mindsetRoles.map(role => role.name);
const mindsetIds = mindsetRoles.map(role => role.value);

const safeRoleList = [
  ...colorIds,
  ...mindsetIds,
  ...premiumColorIds,
];

// const allRoles = [
//   ...colorRoles,
//   ...mindsetRoles,
//   ...premiumColorRoles,
// ];

export const dRole: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove roles.')
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Add a role.')
      .addStringOption(option => option.setName('role')
        .setDescription('The role to add.')
        .setAutocomplete(true)
        .setRequired(true))
      .addUserOption(option => option.setName('user')
        .setDescription('(Mod only, defaults to you) The user to give the role.')))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Remove a role.')
      .addStringOption(option => option.setName('role')
        .setDescription('The role to remove.')
        .setAutocomplete(true)
        .setRequired(true))
      .addUserOption(option => option.setName('user')
        .setDescription('(Mod only, defaults to you) The user to remove the role.'))),
  async execute(interaction) {
    startlog(F, interaction);
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.guild) return false;
    const command = interaction.options.getSubcommand();
    let role = {} as Role;

    const roleId = interaction.options.getString('role', true);
    // log.debug(F, `Role ID: ${roleId}`);

    // Check if roleId contains any letters
    if (/[a-zA-Z]/.test(roleId)) {
      // log.debug(F, 'Role ID is not a number');
      // If the role provided isnt an ID, try to find it by name
      const roleName = roleId.includes(' ') ? roleId.split(' ')[1].trim() : roleId;
      // log.debug(F, `Role name: ${roleName}`);
      // log.debug(F, `Role cache: ${interaction.guild.roles.cache}`);
      role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase()) as Role; // eslint-disable-line max-len
    } else {
      // log.debug(F, 'Role ID is a number');
      role = await interaction.guild.roles.fetch(roleId) as Role;
    }

    if (!role) {
      interaction.editReply({ content: 'Role not found! Please use the dropdown menu' });
      return false;
    }

    // Check if interaction.member type is APIInteractionGuildMember
    const isMod = (interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR);
    const isTs = (interaction.member as GuildMember).roles.cache.has(env.ROLE_TRIPSITTER);
    const isDonor = (interaction.member as GuildMember).roles.cache.has(env.ROLE_DONOR);
    const isPatron = (interaction.member as GuildMember).roles.cache.has(env.ROLE_PATRON);

    // log.debug(F, `isMod: ${isMod}, isTs: ${isTs}, isDonor: ${isDonor}, isPatron: ${isPatron}`);

    // If you're not a mod or tripsitter, you can't add anything that's not in the "safe" list
    if (!safeRoleList.includes(role.id) && !isMod && !isTs) {
      // log.debug(F, `role.id is ${role.id} and is not in the safe list. (isMod: ${isMod}, isTs: ${isTs})`);
      interaction.editReply({ content: 'You do not have permission to use that role!' });
      return false;
    }

    // You cant add a premium color if you're not a team member or a donor
    if (premiumColorIds.includes(role.id) && !isMod && !isTs && !isDonor && !isPatron) {
      // log.debug(F, `role.id is ${role.id} is a premium role and the user is not premium
      // (isMod: ${isMod}, isTs: ${isTs} isDonor: ${isDonor}, isPatron: ${isPatron})`);
      interaction.editReply({ content: 'You do not have permission to use that role!' });
      return false;
    }

    // If the user option was used, get that user, otherwise use the interaction user
    const selectedUser = interaction.options.getUser('user') ?? interaction.user;

    // If you're not a mod or tripsitter, you can't add anything to anyone but yourself
    const user = isMod || isTs ? selectedUser : interaction.user;

    // Get the member object for the user
    const member = await interaction.guild.members.fetch(user.id);
    const target = member.displayName;

    let verb = '' as string;
    let preposition = '' as string;
    if (command === 'add') {
      verb = 'added';
      preposition = 'to';

      await member.roles.add(role);

      // Remove the other color roles if you're adding a color role
      if (colorIds.includes(role.id)) {
        // log.debug(F, 'Removing other color roles');
        const otherColorRoles = colorIds.filter(r => r !== role.id);
        await member.roles.remove([...otherColorRoles, ...premiumColorIds]);
      }

      // Remove the other premium mindset roles if you're adding a mindset role
      if (premiumColorIds.includes(role.id)) {
        // log.debug(F, 'Removing other premium color roles');
        const otherPremiumColorRoles = premiumColorIds.filter(r => r !== role.id);
        await member.roles.remove([...otherPremiumColorRoles, ...colorIds]);
      }

      // Remove the other mindset roles if you're adding a mindset role
      if (mindsetIds.includes(role.id)) {
        // log.debug(F, 'Removing other mindset roles');
        const otherMindsetRoles = mindsetIds.filter(r => r !== role.id);
        await member.roles.remove([...otherMindsetRoles]);
      }

      await interaction.editReply({ content: `Added ${role.name} to ${member.displayName}!` });
    } else if (command === 'remove') {
      verb = 'removed';
      preposition = 'from';
      await member.roles.remove(role);
      await interaction.editReply({ content: `Removed ${role.name} from ${target}!` });
    }

    const targetstring = target !== '' ? ` ${preposition} ${target}` : '';
    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await channelBotlog.send(`${(interaction.member as GuildMember).displayName} ${verb} ${role.name}${targetstring}`);

    return true;
  },
};
