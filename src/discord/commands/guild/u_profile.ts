import {
  ContextMenuCommandBuilder,
  GuildMember,
  Colors,
  time,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import {UserCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import env from '../../../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

let actor = {} as GuildMember;
let target = {} as GuildMember;

export const info: UserCommand = {
  data: new ContextMenuCommandBuilder()
      .setName('Profile')
      .setType(ApplicationCommandType.User),
  async execute(interaction) {
    actor = interaction.member as GuildMember;
    logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.targetMember as GuildMember;
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

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
                // eslint-disable-next-line max-len
                {name: 'Timezone', value: `${targetData.timezone ? targetData.timezone : 'Use /time set to set a timezone!'}`, inline: true},
            )
            .addFields(
                {name: 'Account created', value: `${time(target.user.createdAt, 'R')}`, inline: true},
                {name: 'Joined', value: `${target.joinedAt ? time(target.joinedAt, 'R') : 'idk'}`, inline: true},
                // eslint-disable-next-line max-len
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
    logger.debug(`[${PREFIX}] finished!`);
  },
};
