/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  time,
  Colors,
  GuildMember,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const profile: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('profile')
      .setDescription('Return the user\'s profile!')
      .addUserOption((option) => option
          .setName('target')
          .setDescription('User to get info on!')
          .setRequired(true)),
  async execute(
      interaction:ChatInputCommandInteraction | UserContextMenuCommandInteraction) {
    const target = interaction.options.getMember('target')! as GuildMember;

    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return;
    }

    // let targetFromIrc = options ? false : null;
    // let targetFromDiscord = options ? true : null;
    // let targetIsMember = options ? true : null;

    // Determine target information
    // if (typeof target !== 'object') {
    //   if (target.startsWith('<@') && target.endsWith('>')) {
    //     // If the target string starts with a < then it's likely a discord user
    //     // targetFromIrc = false;
    //     // targetFromDiscord = true;
    //     // targetIsMember = true;
    //     const targetId = target.slice(3, -1);
    //     logger.debug(`[${PREFIX}] targetId: ${targetId}`);
    //     try {
    //       target = await interaction.guild.members.fetch(target.id);
    //     } catch (err) {
    //       logger.error(err);
    //       interaction.reply('Could not find that user!');
    //       return;
    //     }
    //   }
    // else {
    //   // Do a whois lookup to the user
    //   let data = null;
    //   await global.ircClient.whois(target, async (resp) => {
    //     data = resp;
    //   });

    //   // This is a hack substanc3 helped create to get around the fact that the whois command
    //   // is asyncronous by default, so we need to make this syncronous
    //   while (data === null) {
    //     await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
    //   }
    //   // logger.debug(`[${PREFIX}] data ${JSON.stringify(data, null, 2)}`);
    //   if (!data.host) {
    //     const embed = embedTemplate();
    //     logger.debug(`[${PREFIX}] ${target} not found on IRC`);
    //     embed.setDescription(stripIndents`${target} is not found on IRC, did you spell that right?`);
    //     interaction.reply({embeds: [embed], ephemeral: true});
    //     return;
    //   }
    //   // targetFromIrc = true;
    //   // targetFromDiscord = false;
    //   // targetIsMember = false;
    //   target = data;
    // }
    // }

    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    if (!target) {
      const embed = embedTemplate()
          .setColor(Colors.Red)
          .setDescription('Target not found?');
      interaction.reply({embeds: [embed], ephemeral: true});
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

    // Extract target data
    const targetUsername = `${target.user.username}#${target.user.discriminator}`;

    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${target.id}`);
      await ref.once('value', (data:any) => {
        let targetData:any = {};
        if (data.val() !== null) {
          targetData = data.val();
        }
        const givenKarma = targetData.karma_given || 0;
        const takenKarma = targetData.karma_received || 0;
        let targetBirthday:string | Date = 'Use /birthday to set a birthday!';

        if (targetData.discord) {
          if (targetData.birthday) {
            targetBirthday = targetData.birthday ?
              new Date(`${targetData.birthday[0]} ${targetData.birthday[1]}, 2022`) :
              'Use /birthday to set a birthday!';
            logger.debug(`[${PREFIX}] targetBirthday: ${targetBirthday}`);
            logger.debug(`[${PREFIX}] typeof targetBirthday: ${typeof targetBirthday}`);
          }
        }

        const targetEmbed = embedTemplate()
            .setColor(Colors.Blue)
            .setDescription(`${target.user.username}'s profile!`)
            .addFields(
                {name: 'Username', value: targetUsername, inline: true},
                {name: 'Nickname', value: `${target.nickname ? target.nickname : 'No nickname'}`, inline: true},
                {name: 'Timezone', value: `${targetData.timezone ? targetData.timezone : 'Use /time set to set a timezone!'}`, inline: true},
            )
            .addFields(
                {name: 'Account created', value: `${time(target.user.createdAt, 'R')}`, inline: true},
                {name: 'Joined', value: `${target.joinedAt ? time(target.joinedAt, 'R') : 'idk'}`, inline: true},
                {name: 'Birthday', value: `${typeof targetBirthday === 'string' ? targetBirthday : time(targetBirthday, 'R')}`, inline: true},
            )
            .addFields(
                {name: 'Karma Given', value: `${givenKarma}`, inline: true},
                {name: 'Karma Received', value: `${takenKarma}`, inline: true},
                {name: '\u200B', value: '\u200B', inline: true},
            );

        interaction.reply({embeds: [targetEmbed], ephemeral: false});

        logger.debug(`[${PREFIX}] finished!`);
      });
    }
  },
};
