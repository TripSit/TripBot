import {IntegrationExpireBehavior} from 'discord.js';
import internal from 'stream';

/**
 * Does something
 * @param {number} discordChannel
 * @param {string} ircChannel
 * @return {any} something
 */
export async function joinWording(discordChannel:number, ircChannel:string):Promise<any> {
  return `
  🤖🔗 <#${discordChannel}> is bridged with ${ircChannel} on IRC. Just click on the channel, 
  or type /join ${ircChannel} on irc. /bridge for more information
  `;
};

