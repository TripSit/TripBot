import {
  Client,
  Colors,
  VoiceState,
  VoiceBasedChannel,
  ChannelType,
  CategoryChannel,
  PermissionsBitField,
  Guild,
  GuildMember,
  GuildPremiumTier,
  EmbedBuilder,
  MessageFlags,
  TextDisplayBuilder,
  SeparatorBuilder,
  ContainerBuilder,
  SeparatorSpacingSize,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line

// Shared mapping of level requirement -> VIP role id. Used by both the /tent level
// command and the status line, so the threshold logic lives in one place.
export const levelRoles: { [level: number]: string } = {
  0: env.ROLE_VIP_0,
  10: env.ROLE_VIP_10,
  20: env.ROLE_VIP_20,
  30: env.ROLE_VIP_30,
  40: env.ROLE_VIP_40,
  50: env.ROLE_VIP_50,
  60: env.ROLE_VIP_60,
  70: env.ROLE_VIP_70,
  80: env.ROLE_VIP_80,
  90: env.ROLE_VIP_90,
  100: env.ROLE_VIP_100,
};

/**
 * Derive a tent's current level requirement from its permission overwrites.
 * `/tent level N` denies every VIP role *below* N, so the requirement is the
 * highest denied level + 10. Returns 0 when there is no requirement.
 * @param {VoiceBasedChannel} channel The tent channel
 * @return {number} The level requirement (0 = none)
 */
export function getTentLevel(channel: VoiceBasedChannel): number {
  let highestDenied = -1;
  Object.entries(levelRoles).forEach(([key, roleId]) => {
    const level = parseInt(key, 10);
    const overwrite = channel.permissionOverwrites.cache.get(roleId);
    if (overwrite && overwrite.deny.has(PermissionsBitField.Flags.ViewChannel) && level > highestDenied) {
      highestDenied = level;
    }
  });
  return highestDenied < 0 ? 0 : highestDenied + 10;
}

// Store timeouts for each channel to handle host rejoining
const hostTimeouts: { [channelId: string]: NodeJS.Timeout } = {};

// Debounce timers for voice-status updates, to coalesce rapid join/leave bursts
const statusTimeouts: { [channelId: string]: NodeJS.Timeout } = {};

// The member-typed portion of each tent's voice status, kept so the bot can
// decorate it with state icons instead of clobbering it. Keyed by channel id.
const memberStatus: { [channelId: string]: string } = {};

// The exact status string the bot last wrote per channel. Our own PUT triggers a
// VOICE_CHANNEL_STATUS_UPDATE dispatch; this lets the raw listener ignore that
// echo so it isn't mistaken for a member edit (which would loop forever).
const lastWritten: { [channelId: string]: string } = {};

// Separator between the bot-owned status segments (lock / level).
const STATUS_SEP = ' · ';

// Separator between our icons and the member's free-text status. The pipe makes
// the member's portion easy to recover on edits and visually distinct.
const MEMBER_SEP = ' | ';

// The glyphs our segments start with. Only used as a fallback for telling our
// text apart from the member's when the pipe separator has gone missing.
const TENT_ICONS = ['🔒', '🎖️'];

/**
 * Build the icon part of a tent's status from its live state: lock and level.
 * Each piece is dropped when it doesn't apply, then dot-separated.
 * @param {VoiceBasedChannel} channel The tent channel
 * @return {string} The status line
 */
export function getTentStatusLine(channel: VoiceBasedChannel): string {
  const segments: string[] = [];

  // Lock — show 🔒 only when locked; an open tent is the default and needs no marker
  const open = channel.permissionsFor(channel.guild.roles.everyone).has(PermissionsBitField.Flags.Connect);
  if (!open) segments.push('🔒');

  // Level requirement
  const level = getTentLevel(channel);
  if (level > 0) {
    segments.push(`🎖️ ${level}+`);
  }

  return segments.join(STATUS_SEP);
}

/**
 * Combine the bot's state icons with whatever status the member set, so the
 * member's text is preserved rather than overwritten. Either part may be empty.
 * @param {VoiceBasedChannel} channel The tent channel
 * @return {string} The combined status string to write
 */
function composeTentStatus(channel: VoiceBasedChannel): string {
  const icons = getTentStatusLine(channel);
  const member = memberStatus[channel.id] ?? '';
  return [icons, member].filter(Boolean).join(MEMBER_SEP);
}

/**
 * Recover the member-typed portion of a status. We write `icons | member`, so the
 * member's text is everything after the first pipe separator. As a fallback (member
 * cleared our prefix, or Discord normalised the separator), drop any leading
 * dot-separated segments that start with one of our glyphs.
 * @param {string} full The full status string as set on the channel
 * @return {string} The member's portion, with our icons removed
 */
function extractMemberText(full: string): string {
  const pipe = full.indexOf(MEMBER_SEP);
  if (pipe !== -1) return full.slice(pipe + MEMBER_SEP.length).trim();

  const isOurs = (segment: string): boolean => TENT_ICONS.some(icon => segment.trim().startsWith(icon));
  const segments = full.split(STATUS_SEP);
  let i = 0;
  while (i < segments.length && isOurs(segments[i])) {
    i += 1;
  }
  return segments.slice(i).join(STATUS_SEP).trim();
}

/**
 * Push the current state to the tent's Discord voice-status line (the text shown
 * under the channel name). Debounced (~2.5s) to stay within the endpoint's rate
 * limit. discord.js 14 has no helper for this, so we call the raw REST route.
 * @param {VoiceBasedChannel} channel The tent channel
 * @return {void}
 */
export function updateTentStatus(channel: VoiceBasedChannel): void {
  if (!channel?.name.includes('⛺')) return; // tents only
  if (statusTimeouts[channel.id]) clearTimeout(statusTimeouts[channel.id]);
  statusTimeouts[channel.id] = setTimeout(async () => {
    delete statusTimeouts[channel.id];
    try {
      const status = composeTentStatus(channel);
      // Record before the PUT so the dispatch our own write triggers is ignored.
      lastWritten[channel.id] = status;
      await channel.client.rest.put(`/channels/${channel.id}/voice-status`, { body: { status } });
    } catch (err) {
      log.error(F, `Failed to set tent status: ${err}`);
    }
  }, 2500);
}

/**
 * Listen for members setting a tent's voice status and re-apply it with the
 * bot's state icons attached, so the two coexist in the single status field.
 *
 * discord.js forwards every gateway dispatch as the 'raw' event, but it isn't in
 * the typed ClientEvents and VOICE_CHANNEL_STATUS_UPDATE isn't modelled in this
 * discord-api-types version — hence the narrow cast and hand-written payload type.
 * @param {Client} client The Discord client
 * @return {void}
 */
export function registerTentStatusSync(client: Client): void {
  type RawStatusPacket = { t?: string; d?: { id?: string; status?: string | null } };
  (client as unknown as {
    on(event: 'raw', listener: (packet: RawStatusPacket) => void): void;
  }).on('raw', packet => {
    if (packet.t !== 'VOICE_CHANNEL_STATUS_UPDATE' || !packet.d?.id) return;
    const channel = client.channels.cache.get(packet.d.id);
    if (!channel?.isVoiceBased() || !channel.name.includes('⛺')) return;

    const incoming = packet.d.status ?? '';
    // Ignore the echo of our own write; only react to genuine member edits.
    if (incoming === (lastWritten[channel.id] ?? '')) return;

    memberStatus[channel.id] = extractMemberText(incoming);
    updateTentStatus(channel);
  });
}

/**
 * Template
 * @param {VoiceState} Old The previous voice state
 * @param {VoiceState} New The current voice state
 * @return {Promise<void>}
* */
export async function pitchTent(
  Old:VoiceState,
  New:VoiceState,
): Promise<void> {
  // const categoryVoice = await New.guild.channels.fetch(env.CATEGORY_VOICE) as VoiceBasedChannel;
  // const permissions = categoryVoice.permissionOverwrites.cache;

  function getMaxBitrate(guild: Guild): number {
    switch (guild.premiumTier) {
      case GuildPremiumTier.None:
        return 96000;
      case GuildPremiumTier.Tier1:
        return 128000;
      case GuildPremiumTier.Tier2:
        return 256000;
      case GuildPremiumTier.Tier3:
        return 384000;
      default:
        return 64000;
    }
  }

  log.debug(F, `pitchTent: creating tent for ${New.member?.displayName} under category ${env.CATEGORY_VOICE}`);
  New.member?.guild.channels.create({
    name: `⛺│${New.member.displayName}'s tent`,
    type: ChannelType.GuildVoice,
    parent: env.CATEGORY_VOICE,
    bitrate: getMaxBitrate(New.member.guild),
    userLimit: 8,
    permissionOverwrites: [
      {
        id: New.member.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.MoveMembers,
        ],
      },
      {
        id: New.member.guild.roles.everyone,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
          PermissionsBitField.Flags.UseEmbeddedActivities,
          PermissionsBitField.Flags.UseVAD,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.EmbedLinks,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.AddReactions,
          PermissionsBitField.Flags.UseExternalStickers,
          PermissionsBitField.Flags.UseExternalEmojis,
          PermissionsBitField.Flags.UseApplicationCommands,
        ],
      },
      {
        id: env.ROLE_MODERATOR,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
        ],
      },
      {
        id: env.ROLE_NEEDSHELP,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
    ],
  }).then(async newChannel => {
    New.member?.voice.setChannel(newChannel.id);
    await newChannel.fetch();
    await newChannel.send({
      components: [
        new ContainerBuilder({
          components: [
            new TextDisplayBuilder().setContent(`## Welcome to your tent, <@${New.member?.id}>`).toJSON(),

            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true).toJSON(),

            new TextDisplayBuilder().setContent([
              '### Looking for others to join?',
              '</tent ping:1349687950006423583> — Ping everyone opted-in to VC invites',
            ].join('\n')).toJSON(),

            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true).toJSON(),

            new TextDisplayBuilder().setContent([
              '### Modify your tent',
              '</tent name:1349687950006423583> — Rename your tent',
              '</tent limit:1349687950006423583> — Set a user limit',
              '</tent level:1349687950006423583> — Set a level requirement',
              '</tent lock:1349687950006423583> — Lock your tent',
            ].join('\n')).toJSON(),

            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true).toJSON(),

            new TextDisplayBuilder().setContent([
              '### Moderate your tent',
              '</tent add:1349687950006423583> — Allow a user to join/see your tent',
              '</tent ban:1349687950006423583> — Ban a user from your tent',
              '</tent host:1349687950006423583> — Transfer tent ownership',
            ].join('\n')).toJSON(),

            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true).toJSON(),

            new TextDisplayBuilder().setContent([
              '*Host will automatically transfer to the first person to join your tent if you are disconnected for more than 5 minutes.*',
              '***To undo a command, just use it again.***',
            ].join('\n')).toJSON(),
          ],
        }),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
    updateTentStatus(newChannel);
  }).catch(err => {
    log.error(F, `pitchTent: failed to create tent (category ${env.CATEGORY_VOICE}): ${err}`);
  });
}

/**
 * Template
 * @param {VoiceState} Old The previous voice state
 * @param {VoiceState} New The current voice state
 * @return {Promise<void>}
* */
export async function teardownTent(
  Old:VoiceState,
): Promise<void> {
  const tempVoiceCategory = await Old.guild.channels.fetch(env.CATEGORY_VOICE) as CategoryChannel;
  const deletePromises = tempVoiceCategory.children.cache.map(async channel => {
    // Get the number of humans in the channel
    const humans = channel.members.filter(member => !member.user.bot).size;

    // If the channel is a voice channel, and it's a tent, and there are no humans in it delete it
    if (channel.type === ChannelType.GuildVoice && channel.name.includes('⛺') && humans < 1) {
      // Clear any pending host transfer timeout for this channel
      if (hostTimeouts[channel.id]) {
        clearTimeout(hostTimeouts[channel.id]);
        delete hostTimeouts[channel.id];
      }

      // Clear any pending status-update timeout for this channel
      if (statusTimeouts[channel.id]) {
        clearTimeout(statusTimeouts[channel.id]);
        delete statusTimeouts[channel.id];
      }

      // Drop the cached status state for this (now gone) tent
      delete memberStatus[channel.id];
      delete lastWritten[channel.id];

      try {
        await Old.guild.channels.fetch(channel.id);
        // If fetch succeeds, delete the channel
        await channel.delete('Removing temporary voice chan!');
      } catch (err) {
        // Channel was likely already deleted or doesn't exist
      }
    }
  });

  await Promise.all(deletePromises);
}

export async function transferTent(
  channel: VoiceBasedChannel,
  oldHost: GuildMember,
): Promise<void> {
  // Get the first user that joined that is still in the channel
  const newHost = channel.members.first();
  if (newHost) {
    const embed = new EmbedBuilder()
      .setTitle('Host transferred')
      .setColor(Colors.Blue)
      .setDescription(`
        The new host is ${newHost}.

        Note: Old hosts can still rejoin. (They will not be host)`);
    await channel.send({
      content: `<@${newHost.id}>`,
      embeds: [embed],
    });
  }

  // Remove the host permissions
  if (oldHost) {
    channel.permissionOverwrites.edit(oldHost.id, {
      MoveMembers: null, // Set to neutral
    });
  }

  // Add new host permissions
  if (newHost) {
    channel.permissionOverwrites.create(newHost.id, {
      Connect: true,
      MoveMembers: true,
    });
    // Rename the channel
    channel.setName(`⛺│${newHost.displayName}'s tent`);
  }

  // The transfer has fired, so clear the (now stale) pending-transfer marker and
  // refresh the status so it shows the new host instead of ⏳.
  if (hostTimeouts[channel.id]) {
    delete hostTimeouts[channel.id];
  }
  updateTentStatus(channel);
}

const joinMessages = [
  'Hope you brought snacks!',
  'The marshmallows are crisp!',
  'The fire is warm!',
  'There is a comfy spot for you!',
  'Hope you brought a sleeping bag!',
  'Time to make some s\'mores!',
  'The stars are out tonight!',
  'Do you have any ghost stories?',
  'Do you have any campfire songs?',
  'Coffee or tea?',
];

const leaveMessages = [
  'I hope they had a good time!',
  'I think they forgot their glasses!',
  'I hope they can see in the dark!',
  'I hope they find their way back!',
  'Hopefully they brought a flashlight!',
  'They didn\'t even finish their tea!',
  'Did anyone see where they went?',
  'Gone but not forgotten!',
];

export async function logTent(
  Old: VoiceState,
  New: VoiceState,
): Promise<void> {
  let embed;

  log.debug(F, `${Old} ${New}`);

  // Helper function to check if a user has an explicit permission overwrite
  function hasExplicitPermission(channel: VoiceBasedChannel, member: GuildMember, permission: bigint): boolean {
    const overwrite = channel.permissionOverwrites.cache.get(member.id);
    return overwrite ? overwrite.allow.has(permission) : false;
  }

  // If the user left a tent and wasn't the last one
  if (Old.channel && Old.channel.name.includes('⛺') && Old.member && Old.channel && Old.channel.members.size >= 1) {
    log.debug(F, `Old.channel: ${Old.channel}`);
    // Check if the user that left was the host by checking explicit permissions
    if (hasExplicitPermission(Old.channel, Old.member as GuildMember, PermissionsBitField.Flags.MoveMembers)) {
      embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(`The host, ${Old.member} left!
        Host will transfer <t:${Math.floor(Date.now() / 1000) + 300}:R> if they don't return`);
      await Old.channel.send({ embeds: [embed] });

      // Set a timeout to transfer host after 5 minutes
      hostTimeouts[Old.channel.id] = setTimeout(async () => {
        if (Old.channel) {
          await transferTent(Old.channel, Old.member as GuildMember);
        }
      }, 300000); // 5 minutes in milliseconds
    } else {
      embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(`${Old.member} left the tent.
          *${leaveMessages[Math.floor(Math.random() * leaveMessages.length)]}*`);
      await Old.channel.send({ embeds: [embed] });
    }
  }

  // If the user joined a tent
  if (New.channel && New.channel.name.includes('⛺') && New.member) {
    log.debug(F, `New.channel: ${New.channel}`);
    log.debug(F, `List of members: ${New.channel.members.map(member => member.displayName)}`);

    // Check if the user that joined is the host by checking explicit permissions
    if (hasExplicitPermission(New.channel, New.member as GuildMember, PermissionsBitField.Flags.MoveMembers)) {
      // Clear the timeout if the host rejoined
      if (hostTimeouts[New.channel.id]) {
        clearTimeout(hostTimeouts[New.channel.id]);
        delete hostTimeouts[New.channel.id];
        embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`The host, ${New.member}, has rejoined.
            Host transfer cancelled`);
        await New.channel.send({ embeds: [embed] });
      }
    } else {
      embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setDescription(`${New.member} joined the tent.
          *${joinMessages[Math.floor(Math.random() * joinMessages.length)]}*`);
      await New.channel.send({ embeds: [embed] });
    }
  }
}
