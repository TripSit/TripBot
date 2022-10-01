import {
  Colors,
  ContextMenuCommandBuilder,
  GuildMember,
  TextChannel,
  time,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import {UserCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import env from '../../../global/utils/env.config';
import {embedTemplate} from '../../utils/embedTemplate';
const PREFIX = path.parse(__filename).name;

const teamRoles = [
  env.ROLE_DIRECTOR,
  env.ROLE_SUCCESSOR,
  env.ROLE_SYSADMIN,
  env.ROLE_LEADDEV,
  env.ROLE_IRCADMIN,
  env.ROLE_DISCORDADMIN,
  env.ROLE_IRCOP,
  env.ROLE_MODERATOR,
  env.ROLE_TRIPSITTER,
  env.ROLE_TEAMTRIPSIT,
  env.ROLE_TRIPBOT2,
  env.ROLE_TRIPBOT,
  env.ROLE_BOT,
  env.ROLE_DEVELOPER,
];

const colorRoles = [
  env.ROLE_TREE,
  env.ROLE_SPROUT,
  env.ROLE_SEEDLING,
  env.ROLE_BOOSTER,
  env.ROLE_RED,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_GREEN,
  env.ROLE_BLUE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  // env.ROLE_BROWN,
  env.ROLE_BLACK,
  env.ROLE_WHITE,
];

const mindsetRoles = [
  env.ROLE_DRUNK,
  env.ROLE_HIGH,
  env.ROLE_ROLLING,
  env.ROLE_TRIPPING,
  env.ROLE_DISSOCIATING,
  env.ROLE_STIMMING,
  env.ROLE_NODDING,
  env.ROLE_SOBER,
];

const otherRoles = [
  env.ROLE_VERIFIED,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles},${otherRoles}`;

let target = {} as GuildMember;
export const uUnderban: UserCommand = {
  data: new ContextMenuCommandBuilder()
      .setName('Underban')
      .setType(ApplicationCommandType.User),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    target = interaction.targetMember as GuildMember;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    const role = interaction.guild!.roles.cache.find((r) => r.id === env.ROLE_UNDERBAN)!;
    target.roles.add(role);
    // Remove all roles, except team and vanity, from the target
    target.roles.cache.forEach((role) => {
      logger.debug(`[${PREFIX}] role: ${role.name} - ${role.id}`);
      if (!ignoredRoles.includes(role.id) && !role.name.includes('@everyone') && !role.name.includes('Underban')) {
        logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.displayName}`);
        try {
          target.roles.remove(role);
        } catch (err) {
          logger.debug(
              `[${PREFIX}] There was an error removing the role ${role.name} from ${target.displayName}\n${err}`,
          );
        }
      }
    });
    const targetEmbed = embedTemplate()
        .setColor(Colors.Yellow)
        .setDescription(`${target} ***was underbanned***`)
        .setAuthor(null)
        .setThumbnail(target.user.displayAvatarURL())
        .setFooter(null)
        .addFields(
            {name: 'Nickname', value: `${target.nickname}`, inline: true},
            {name: 'Tag', value: `${target.user.username}#${target.user.discriminator}`, inline: true},
            {name: 'ID', value: `${target.user.id}`, inline: true},
        )
        .addFields(
            {name: 'Account created', value: `${time(target.user.createdAt, 'R')}`, inline: true},
        );
    if (target.joinedAt) {
      targetEmbed.addFields(
          {name: 'Joined', value: `${time(target.joinedAt, 'R')}`, inline: true},
      );
    }
    // Here
    logger.debug(`[${PREFIX}] CHANNEL_MODERATORS: ${env.CHANNEL_MODERATORS}`);
    const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    // We must send the mention outside of the embed, cuz mentions dont work in embeds
    modChan.send({embeds: [targetEmbed]});
    logger.debug(`[${PREFIX}] sent a message to the moderators room`);

    interaction.reply({
      ephemeral: true,
      content: 'Done!',
    });
  },
};
