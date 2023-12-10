// import {
//   MessageReaction,
//   User,
// } from 'discord.js';
import { stripIndents } from 'common-tags';
import { TextChannel } from 'discord.js';
import {
  MessageReactionAddEvent,
} from '../@types/eventDef';
import { chitragupta } from '../utils/chitragupta';
import { bestOf } from '../utils/bestOfTripsit';
import { updatePollEmbed } from '../commands/global/d.poll';
import { embedTemplate } from '../utils/embedTemplate';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export const messageReactionAdd: MessageReactionAddEvent = {
  name: 'messageReactionAdd',
  async execute(messageReaction, user) {
    try {
      await messageReaction.fetch();
    } catch (e) {
      log.error(F, 'Failed to fetch messageReaction');
      // return;
    }
    try {
      await messageReaction.message.fetch(); // Get the message object so that we can do stuff between restarts
    } catch (e) {
      log.error(F, 'Failed to fetch message data');
      // return;
    }

    if (!messageReaction.message.guild) return; // Ignore DMs
    log.info(F, stripIndents`${user} added ${messageReaction.emoji.name} on to \
        ${messageReaction.message.author?.displayName}'s message`);
    // AI audit stuff comes first cuz this can happen on other guilds
    // We want to collect every message tripbot sends that gets three thumbs downs
    const thumbsUpEmojis = ['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿', 'ts_thumbup'];
    const thumbsDownEmojis = ['👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿', 'ts_thumbdown'];
    if (messageReaction.message.author?.bot
      && (thumbsUpEmojis.includes(messageReaction.emoji.name as string)
        || thumbsDownEmojis.includes(messageReaction.emoji.name as string)
      )
    ) {
      log.debug(F, `Someone reacted to tripbot's message with an audit emoji (${messageReaction.emoji.name})`);

      const auditLimit = env.NODE_ENV === 'production' ? 4 : 2;
      log.debug(F, `Audit limit is ${auditLimit}, emoji count is ${messageReaction.count}`);
      if (messageReaction.count === auditLimit) {
        log.debug(F, `Audit limit reached (${auditLimit})`);

        const action = thumbsUpEmojis.includes(messageReaction.emoji.name as string) ? 'approve' : 'reject';
        const message = thumbsUpEmojis.includes(messageReaction.emoji.name as string)
          ? stripIndents`${messageReaction.message.cleanContent}
            
        **Thank you for your feedback, I have notified Moonbear that this response was excellent.**`
          : stripIndents`~~${messageReaction.message.cleanContent}~~
            
        **Thank you for your feedback, I have notified Moonbear that this response was improper.**`;

        // This happens before the message is edited, so we need to fetch the original message
        const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
        const originalMessage = await messageReaction.message.fetchReference();
        const ownerMention = `<@${env.DISCORD_OWNER_ID}>`;
        await channelAiLog.send({
          content: stripIndents`
            AI response ${action} by ${messageReaction.message.guild.name} ${action === 'reject' ? ownerMention : ''}`,
          embeds: [embedTemplate()
            .setTitle(`AI ${action}`)
            .setDescription(stripIndents`
              ${originalMessage.author.displayName} (${originalMessage.author.id}):
              \`${originalMessage.cleanContent}\`

              TripBot:
              \`${messageReaction.message.cleanContent}\`

              This was deemed ${action === 'reject' ? 'improper' : 'excellent'}
            `)],
        });

        await messageReaction.message.edit(message);

        // Remove the emojis so someone can't just toggle it on and off
        await messageReaction.message.reactions.removeAll();
      }
      return;
    }

    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (messageReaction.message.guild?.id !== env.DISCORD_GUILD_ID) return;

    // Don't run on bots
    if (user.bot) {
      // log.debug(F, `Ignoring bot interaction`);
      return;
    }

    chitragupta(messageReaction, user, 1);
    bestOf(messageReaction);
    updatePollEmbed(messageReaction);
    // await communityMod(reaction, user);
  },
};

export default messageReactionAdd;
