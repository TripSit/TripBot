// import {
//   ChannelType,
// } from 'discord-api-types/v10';
import { TextChannel } from 'discord.js';
import {
  MessageCreateEvent,
} from '../@types/eventDef';
// import {thoughtPolice} from '../utils/d.thoughtPolice';
import { experience } from '../../global/utils/experience';
import { announcements } from '../utils/announcements';
import { messageCommand } from '../utils/messageCommand';
import { youAre } from '../utils/youAre';
// import { modmailDMInteraction, modmailThreadInteraction } from '../commands/guild/modmail';
import { getUser } from '../../global/utils/knex';
import { karma } from '../utils/karma';
import { ExperienceCategory, ExperienceType } from '../../global/@types/database';
import { imagesOnly } from '../utils/imagesOnly';
// import log from '../../global/utils/log';
// import {parse} from 'path';

export default messageCreate;

const F = f(__filename); // eslint-disable-line

const ignoredRoles = Object.values({
  needshelp: [env.ROLE_NEEDSHELP],
  newbie: [env.ROLE_NEWBIE],
  underban: [env.ROLE_UNDERBAN],
  muted: [env.ROLE_MUTED],
  tempvoice: [env.ROLE_TEMPVOICE],
}).flat();

export const messageCreate: MessageCreateEvent = {
  name: 'messageCreate',
  async execute(message) {
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (message.guild && message.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const userData = await getUser(message.author.id, null, null);
    if (userData && userData.discord_bot_ban) {
      return;
    }

    // log.debug(F, `Message: ${JSON.stringify(message, null, 2)}`);

    // Disabled for testing
    // thoughtPolice(message);

    // This needs to run here because the widget bot peeps will use this and they are "bot users"
    // This handles ~ commands
    messageCommand(message);
    youAre(message);
    karma(message);
    imagesOnly(message);

    // Don't run on bots
    if (message.author.bot) {
      return;
    }

    // // If this is a DM, run the modmail function.
    // if (message.channel.type === ChannelType.DM) {
    //   await modmailDMInteraction(message);
    // }

    // Determine if the bot should give exp
    if (
      message.member // Is not a member of a guild
    && message.channel // Was not sent in a channel
    && (message.channel instanceof TextChannel) // Was not sent in a text channel
    && message.guild // Was not sent in a guild
    && !message.author.bot // Was sent by a bot
    && !ignoredRoles.some(role => message.member?.roles.cache.has(role)) // Has a role that should be ignored
    ) {
      // Determine what kind of experience to give
      const experienceCategory = await getCategory(message.channel);
      // Run this now, so that when you're helping in the tech/tripsit rooms you'll always get exp
      experience(message.member, experienceCategory, 'TEXT' as ExperienceType, message.channel);
    }

    // Check if the message came in a thread in the helpdesk channel

    // if (message.channel.isThread()) {
    //   modmailThreadInteraction(message);
    // }

    announcements(message);
  },
};

async function getCategory(channel:TextChannel):Promise<ExperienceCategory> {
  let experienceCategory = '';
  if (channel.parent) {
    // log.debug(F, `parent: ${channel.parent.name} ${channel.parent.id}`);
    if (channel.parent.parent) {
      // log.debug(F, `parent-parent: ${channel.parent.parent.name} ${channel.parent.parent.id}`);
      if (channel.parent.parent.id === env.CATEGORY_TEAMTRIPSIT) {
        experienceCategory = 'TEAM' as ExperienceCategory;
      } else if (channel.parent.parent.id === env.CATEGORY_DEVELOPMENT) {
        experienceCategory = 'DEVELOPER' as ExperienceCategory;
      } else if (channel.parent.parent.id === env.CATEGORY_HARMREDUCTIONCENTRE) {
        experienceCategory = 'TRIPSITTER' as ExperienceCategory;
      } else if (channel.parent.parent.id === env.CATEGORY_GATEWAY) {
        experienceCategory = 'IGNORED' as ExperienceCategory;
      } else {
        experienceCategory = 'GENERAL' as ExperienceCategory;
      }
    } else if (channel.parent.id === env.CATEGORY_TEAMTRIPSIT) {
      experienceCategory = 'TEAM' as ExperienceCategory;
    } else if (channel.parent.id === env.CATEGORY_DEVELOPMENT) {
      experienceCategory = 'DEVELOPER' as ExperienceCategory;
    } else if (channel.parent.id === env.CATEGORY_HARMREDUCTIONCENTRE) {
      experienceCategory = 'TRIPSITTER' as ExperienceCategory;
    } else if (channel.parent.id === env.CATEGORY_GATEWAY) {
      experienceCategory = 'IGNORED' as ExperienceCategory;
    } else {
      experienceCategory = 'GENERAL' as ExperienceCategory;
    }
  } else {
    experienceCategory = 'IGNORED' as ExperienceCategory;
  }
  return experienceCategory as ExperienceCategory;
}
