import type { experience_category, experience_type } from '@prisma/client';

// import {
//   ChannelType,
// } from 'discord-api-types/v10';
import { TextChannel } from 'discord.js';

import type { MessageCreateEvent } from '../@types/eventDef';

import { nightsWatch } from '../../global/commands/g.watchuser';
// import {thoughtPolice} from '../utils/d.thoughtPolice';
import { experience } from '../../global/utils/experience';
import { countMessage } from '../commands/guild/d.counting';
import { announcements } from '../utils/announcements';
import { bridgeMessage } from '../utils/bridge';
import { helperActivityUpdate } from '../utils/helperActivityUpdate';
import { imagesOnly } from '../utils/imagesOnly';
// import { modmailDMInteraction, modmailThreadInteraction } from '../commands/guild/modmail';
import { karma } from '../utils/karma';
import { messageCommand } from '../utils/messageCommand';
import { monitorToxicity } from '../utils/moderateHatespeech';
import { youAre } from '../utils/youAre';
// import { awayMessage } from '../utils/awayMessage';
// import log from '../../global/utils/log';
// import {parse} from 'path';

const F = f(__filename); // eslint-disable-line

const ignoredRoles: string[] = Object.values({
  muted: [env.ROLE_MUTED],
  needshelp: [env.ROLE_NEEDSHELP],
  newbie: [env.ROLE_NEWBIE],
  tempvoice: [env.ROLE_TEMPVOICE],
  underban: [env.ROLE_UNDERBAN],
})
  .flat()
  .filter((role): role is string => typeof role === 'string');

async function getCategory(channel: TextChannel): Promise<experience_category> {
  let experienceCategory = '';
  if (channel.parent) {
    // log.debug(F, `parent: ${channel.parent.name} ${channel.parent.id}`);
    switch (channel.parent.id) {
      case env.CATEGORY_DEVELOPMENT: {
        experienceCategory = 'DEVELOPER' as experience_category;

        break;
      }
      case env.CATEGORY_GATEWAY: {
        experienceCategory = 'IGNORED' as experience_category;

        break;
      }
      case env.CATEGORY_HARMREDUCTIONCENTRE: {
        experienceCategory = 'TRIPSITTER' as experience_category;

        break;
      }
      case env.CATEGORY_TEAMTRIPSIT: {
        experienceCategory = 'TEAM' as experience_category;

        break;
      }
      default: {
        experienceCategory = 'GENERAL' as experience_category;
      }
    }
  } else {
    experienceCategory = 'IGNORED' as experience_category;
  }
  return experienceCategory as experience_category;
}

export const messageCreate: MessageCreateEvent = {
  async execute(message) {
    messageCommand(message);
    bridgeMessage(message);
    // awayMessage(message);
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (message.guild && message.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const userData = await db.users.upsert({
      create: {
        discord_id: message.author.id,
      },
      update: {},
      where: {
        discord_id: message.author.id,
      },
    });

    if (userData && userData.discord_bot_ban) {
      return;
    }

    // log.debug(F, `Message: ${JSON.stringify(message, null, 2)}`);

    // This needs to run here because the widget bot peeps will use this and they are "bot users"
    // This handles ~ commands

    // Don't run on bots
    if (message.author.bot) {
      return;
    }
    countMessage(message);
    youAre(message);
    karma(message);
    imagesOnly(message);
    helperActivityUpdate(message);
    // discordAiModerate(message);
    nightsWatch(message);
    if ('parentId' in message.channel && message.channel.parentId !== env.CATEGORY_TEAMTRIPSIT) {
      monitorToxicity(message);
    }

    // Disabled for testing
    // thoughtPolice(message);

    // // If this is a DM, run the modmail function.
    // if (message.channel.type === ChannelType.DM) {
    //   await modmailDMInteraction(message);
    // }

    // Determine if the bot should give exp
    if (
      message.member && // Is not a member of a guild
      message.channel && // Was not sent in a channel
      message.channel instanceof TextChannel && // Was not sent in a text channel
      message.guild && // Was not sent in a guild
      !ignoredRoles.some((role) => message.member?.roles.cache.has(role)) // Has a role that should be ignored
    ) {
      // Determine what kind of experience to give
      const experienceCategory = await getCategory(message.channel);
      // Run this now, so that when you're helping in the tech/tripsit rooms you'll always get exp
      experience(message.member, experienceCategory, 'TEXT' as experience_type, message.channel);
    }

    // Check if the message came in a thread in the helpdesk channel

    // if (message.channel.isThread()) {
    //   modmailThreadInteraction(message);
    // }

    announcements(message);
  },
  name: 'messageCreate',
};

export default messageCreate;
