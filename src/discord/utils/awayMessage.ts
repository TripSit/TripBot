/* eslint-disable no-unused-vars */

import { Message } from 'discord.js';

const F = f(__filename);

export default awayMessage;

export async function awayMessage(message:Message): Promise<void> {
  // Check if the message mentions the bot owner
  if (!message.mentions.users.has(env.DISCORD_OWNER_ID)) return;

  // Check if it is after 8pm, or before 7am chicago time
  const chicagoTime = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const chicagoHour = new Date(chicagoTime).getHours();
  if (chicagoHour >= 20 || chicagoHour <= 7) {
    message.channel.send(`Hey ${message.member?.displayName}! Moonbear is probably sleeping, but they will get back to you when they can!`);
  }
  // if (chicagoHour >= 16 || chicagoHour <= 20) {
  //   message.channel.send(`Hey ${message.member?.displayName} Moonbear is probably busy. Maybe send them a DM and they will get back to you when they can!`);
  // }
}
