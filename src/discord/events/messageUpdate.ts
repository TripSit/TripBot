import {
  Colors,
  TextChannel,
} from 'discord.js';
import {
  MessageUpdateEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate'; // eslint-disable-line @typescript-eslint/no-unused-vars
// eslint-disable-line no-unused-vars
const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default messageUpdate;

export const messageUpdate: MessageUpdateEvent = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (newMessage.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    // log.debug(F, `oldMessage: ${JSON.stringify(oldMessage, null, 2)}`);
    // log.debug(F, `newMessage: ${JSON.stringify(newMessage, null, 2)}`);

    // Don't run when bots update messages
    if (!newMessage.author) return;
    if (newMessage.author.bot) return;

    const oldContent = oldMessage.content !== undefined && oldMessage.content !== null && oldMessage.content !== ''
      ? oldMessage.content
      : '(Not found)';
    // log.debug(F, `oldContent: ${oldContent}`);
    const newContent = newMessage.content !== undefined && newMessage.content !== null && newMessage.content !== ''
      ? newMessage.content
      : '(Not found)';
    // log.debug(F, `newContent: ${newContent}`);

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setColor(Colors.Yellow)
      .setTitle(`${newMessage.member?.nickname} edited msg in ${(newMessage.channel as TextChannel).name}`)
      .setURL(newMessage.url)
      .addFields([
        { name: 'Old Message', value: oldContent, inline: true },
        { name: 'New Message', value: newContent, inline: true },
      ]);

    // const response = `Message ${newMessage.id} was edited by ${newMessage.author.tag} in
    // ${(newMessage.channel as TextChannel).name} from ${oldMessage.content} to ${newMessage.content}.`;
    const msglog = newMessage.client.channels.cache.get(env.CHANNEL_MSGLOG) as TextChannel;
    await msglog.send({ embeds: [embed] });
  },
};
