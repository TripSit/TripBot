import type {
  // Role,
  Message,
  TextChannel,
} from 'discord.js';

import { stripIndents } from 'common-tags';

import { bigBrother } from '../../global/utils/thoughtPolice';

// import log from '../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

export default thoughtPolice;

/**
 * This runs on every message to determine if a bad word is used
 * @param {Message} message Message to scan
 * @return {Promise<void>}
 */
export async function thoughtPolice(message: Message): Promise<void> {
  // log.debug(F, `${message.member!.displayName} said "${message.cleanContent}"`);
  const channelModlog = (await message.client.channels.fetch(env.CHANNEL_MODLOG)) as TextChannel;

  const result = await bigBrother(message.cleanContent.toLowerCase());

  // log.debug(F, `result: ${result}`);

  if (result && result === 'offensive') {
    message.delete();
    await (message.channel as TextChannel).send(stripIndents`
        As a reminder to everyone: We have a lot of people currently in an altered mindset.
        Please use non-offensive language so we can all have a good time, thank you for cooperating!
        `);
    if (channelModlog) {
      await channelModlog.send(stripIndents`
            ${message.member?.displayName} said "${message.cleanContent}" in ${(message.channel as TextChannel).name}
            I removed it but keep an eye on them!
            `);
    }
    // case 'harm':
    //   if (channelModerators) {
    //     channelModerators.send(stripIndents`
    //       ${message.member?.displayName} is talking about something harmful\
    //        in ${((message.channel as TextChannel) as TextChannel).name}!
    //       `);
    //   }
    //   break;
    // case 'horny':
    //   await (message.channel as TextChannel).send(`
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
    //   await (message.channel as TextChannel).send(randomMemeResponse);
    //   break;
    // case 'pg13':
    //   await channelModerators.send(stripIndents`
    //   ${message.member?.displayName} said "${message.cleanContent}" in ${(message.channel as TextChannel).name}
    //   Keep an eye on them!
    //   `);
    //   break;
  }
}
