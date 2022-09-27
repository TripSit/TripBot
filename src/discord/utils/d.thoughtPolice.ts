import {
  // Role,
  Message,
  TextChannel,
} from 'discord.js';
import env from '../../global/utils/env.config';
import {stripIndents} from 'common-tags';

import {bigBrother} from '../../global/utils/g.thoughtPolice';

// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

/**
 * This runs on every message to determine if a badword is used
 * @param {Message} message Message to scan
 * @return {Promise<void>}
 */
export async function thoughtPolice(message:Message): Promise<void> {
  // logger.debug(`[${PREFIX}] started!`);
  // logger.debug(`[${PREFIX}] ${message.member!.displayName} said "${message.cleanContent}"`);
  const channelModlog = message.client.channels.cache.get(env.CHANNEL_MODLOG) as TextChannel;
  // const roleModerators = message.guild?.roles.cache.find((role:Role) => role.id === env.ROLE_MODERATOR);

  const result = await bigBrother(message.cleanContent.toLowerCase());

  // logger.debug(`[${PREFIX}] result: ${result}`);

  if (result) {
    switch (result) {
      case 'offensive':
        message.delete();
        (message.channel as TextChannel).send(stripIndents`
        As a reminder to everyone: We have a lot of people currently in an altered mindset.
        Please use non-offensive language so we can all have a good time, thank you for cooperating!
        `);
        if (channelModlog) {
          channelModlog.send(stripIndents`
            ${message.member?.displayName} said "${message.cleanContent}" in ${(message.channel as TextChannel).name}
            I removed it but keep an eye on them!
            `);
        }
        break;
      // case 'harm':
      //   if (channelModerators) {
      //     channelModerators.send(stripIndents`
      //       ${message.member?.displayName} is talking about something harmful\
      //        in ${((message.channel as TextChannel) as TextChannel).name}!
      //       `);
      //   }
      //   break;
      // case 'horny':
      //   (message.channel as TextChannel).send(`
      //   We\'re all adults here, but there's probably a better place to talk about that?
      //   `);
      //   break;
      // case 'meme':
      //   const memeResponses = [
      //     'Never heard that one before! 😂😂',
      //     'Did you come up with that?? 😂😂',
      //     'LOOOOOL that\'s a good one LMAO!! 😂😂',
      //     'OMG do you do stand-up?? 😂😂',
      //     'Aww, that\'s nice dear 🙂',
      //   ];
      //   // get random meme response
      //   const randomMemeResponse = memeResponses[Math.floor(Math.random() * memeResponses.length)];
      //   (message.channel as TextChannel).send(randomMemeResponse);
      //   break;
      // case 'pg13':
      //   channelModerators.send(stripIndents`
      //   ${message.member?.displayName} said "${message.cleanContent}" in ${(message.channel as TextChannel).name}
      //   Keep an eye on them!
      //   `);
      //   break;
      default:
        break;
    }
  }
  // logger.debug(`[${PREFIX}] finished!`);
};
