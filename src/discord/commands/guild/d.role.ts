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
  { name: 'Color Red', value: env.ROLE_RED },
  { name: 'Color Orange', value: env.ROLE_ORANGE },
  { name: 'Color Yellow', value: env.ROLE_YELLOW },
  { name: 'Color Green', value: env.ROLE_GREEN },
  { name: 'Color Blue', value: env.ROLE_BLUE },
  { name: 'Color Purple', value: env.ROLE_PURPLE },
  { name: 'Color Pink', value: env.ROLE_PINK },
  { name: 'Color Black', value: env.ROLE_BLACK },
  { name: 'Color White', value: env.ROLE_WHITE },
] as RoleDef[];

// log.debug(F, `Color roles: ${JSON.stringify(colorRoles, null, 2)}`);

const colorIds = colorRoles.map(role => role.value);

const premiumColorRoles = [
  { name: 'Color Donor Red', value: env.ROLE_DONOR_RED },
  { name: 'Color Donor Orange', value: env.ROLE_DONOR_ORANGE },
  { name: 'Color Donor Yellow', value: env.ROLE_DONOR_YELLOW },
  { name: 'Color Donor Green', value: env.ROLE_DONOR_GREEN },
  { name: 'Color Donor Blue', value: env.ROLE_DONOR_BLUE },
  { name: 'Color Donor Purple', value: env.ROLE_DONOR_PURPLE },
  { name: 'Color Donor Pink', value: env.ROLE_DONOR_PINK },
] as RoleDef[];

// log.debug(F, `Premium Color roles: ${JSON.stringify(premiumColorRoles, null, 2)}`);

const premiumColorIds = premiumColorRoles.map(role => role.value);

const mindsetRoles = [
  { name: 'Mindset Drunk', value: env.ROLE_DRUNK },
  { name: 'Mindset High', value: env.ROLE_HIGH },
  { name: 'Mindset Rolling', value: env.ROLE_ROLLING },
  { name: 'Mindset Tripping', value: env.ROLE_TRIPPING },
  { name: 'Mindset Dissociating', value: env.ROLE_DISSOCIATING },
  { name: 'Mindset Stimming', value: env.ROLE_STIMMING },
  { name: 'Mindset Sedated', value: env.ROLE_SEDATED },
  { name: 'Mindset Sober', value: env.ROLE_SOBER },
] as RoleDef[];

// log.debug(F, `Mindset roles: ${JSON.stringify(mindsetRoles, null, 2)}`);

const mindsetIds = mindsetRoles.map(role => role.value);

const safeRoleList = [
  ...colorIds,
  ...mindsetIds,
  ...premiumColorIds,
];

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
    if (!interaction.guild) return false;
    const command = interaction.options.getSubcommand();
    let role = {} as Role;

    // Check if interaction.member type is APIInteractionGuildMember
    const isMod = (interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR);
    const isTs = (interaction.member as GuildMember).roles.cache.has(env.ROLE_TRIPSITTER);
    const isDonor = (interaction.member as GuildMember).roles.cache.has(env.ROLE_DONOR);
    const isPatron = (interaction.member as GuildMember).roles.cache.has(env.ROLE_PATRON);

    let member = {} as GuildMember;
    let verb = '' as string;
    let preposition = '' as string;
    let target = '' as string;
    if (command === 'add') {
      const roleId = interaction.options.getString('role', true);

      // If you're not a mod or tripsitter, you can't add anything that's not in the "safe" list
      if (!safeRoleList.includes(roleId) && !isMod && !isTs) {
        interaction.reply({ content: 'You do not have permission to add that role!', ephemeral: true });
        return false;
      }

      // You cant add a premium color if you're not a team member or a donor
      if (!premiumColorIds.includes(roleId) && !isMod && !isTs && !isDonor && !isPatron) {
        interaction.reply({ content: 'You do not have permission to add that role!', ephemeral: true });
        return false;
      }

      log.debug(F, `Role ID is ${roleId}`);
      role = await interaction.guild.roles.fetch(roleId) as Role;
      if (!role) {
        interaction.reply({ content: 'Role not found! Please use the dropdown menu', ephemeral: true });
        return false;
      }
      verb = 'added';
      preposition = 'to';
      // If the user option was used, get that user, otherwise use the interaction user
      const selectedUser = interaction.options.getUser('user') ?? interaction.user;

      // If you're not a mod or tripsitter, you can't add anything to anyone but yourself
      const user = isMod || isTs ? selectedUser : interaction.user;
      member = await interaction.guild.members.fetch(user.id);
      target = member.displayName;
      await member.roles.add(role);

      // Remove the other color roles if you're adding a color role
      if (colorIds.includes(roleId)) {
        log.debug(F, 'Removing other color roles');
        const otherColorRoles = colorIds.filter(r => r !== roleId);
        await member.roles.remove([...otherColorRoles, ...premiumColorIds]);
      }

      // Remove the other premium mindset roles if you're adding a mindset role
      if (premiumColorIds.includes(roleId)) {
        log.debug(F, 'Removing other premium color roles');
        const otherPremiumColorRoles = premiumColorIds.filter(r => r !== roleId);
        await member.roles.remove([...otherPremiumColorRoles, ...colorIds]);
      }

      // Remove the other mindset roles if you're adding a mindset role
      if (mindsetIds.includes(roleId)) {
        log.debug(F, 'Removing other mindset roles');
        const otherMindsetRoles = mindsetIds.filter(r => r !== roleId);
        await member.roles.remove([...otherMindsetRoles]);
      }

      await interaction.reply({ content: `Added ${role.name} to ${member.nickname}!`, ephemeral: true });
    } else if (command === 'remove') {
      const roleId = interaction.options.getString('role', true);
      role = await interaction.guild.roles.fetch(roleId) as Role;
      verb = 'removed';
      preposition = 'from';
      const selectedUser = interaction.options.getUser('user') ?? interaction.user;
      const user = isMod || isTs ? selectedUser : interaction.user;
      member = await interaction.guild.members.fetch(user.id);
      target = member.displayName;
      await member.roles.remove(role);
      await interaction.reply({ content: `Removed ${role.name} from ${member.nickname}!`, ephemeral: true });
    }

    const targetstring = target !== '' ? ` ${preposition} ${target}` : '';
    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await channelBotlog.send(`${(interaction.member as GuildMember).displayName} ${verb} ${role.name}${targetstring}`);

    return true;
  },
};
