import {
  Collection,
  Message, MessageMentionTypes, TextChannel, Webhook,
} from 'discord.js';
import { database } from '../../global/utils/knex';

export default bridgeMessage;

const F = f(__filename);  // eslint-disable-line

const tripsitBridgeName = 'Tripsit Bridge';

const webhookCache = new Collection<string, Webhook>();

export async function sendMessageToChannel(
  channelId:string,
  message: Message,
):Promise<void> {
  let webhookData = webhookCache.find(webhook => webhook.channelId === channelId);

  // If the webhook isn't found in the cache...
  if (!webhookData) {
    const channel = await client.channels.fetch(channelId) as TextChannel;
    log.debug(F, 'Fetching webhooks');
    webhookData = (await channel.fetchWebhooks())
      .find(webhook => webhook.name === tripsitBridgeName);
    if (!webhookData) {
      log.debug(F, 'Creating new webhook');
      webhookData = await channel.createWebhook({
        name: tripsitBridgeName,
        reason: tripsitBridgeName,
      });
    }
    webhookCache.set(webhookData.id, webhookData);
  }

  await webhookData.send({ // eslint-disable-line no-await-in-loop
    username: `${message.member?.displayName} (${message.guild?.name})`,
    avatarURL: message.author.avatarURL() ?? undefined,
    content: message.content,
    files: message.attachments.size > 0 ? message.attachments.map(attachment => attachment.url) : undefined,
    allowedMentions: { parse: ['users', 'roles'] as MessageMentionTypes[] },
  });
}

export async function bridgeMessage(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.webhookId) return; // Don't run on webhook messages
  if (message.author.bot) return; // Don't run on bot messages
  // This is the bridge utility
  // It will check the database to see if the message was sent in a channel that is configured to be bridged
  // If it is, it will send the message to the bridged channels using a webhook integration
  //
  // If the message comes from inside the main guild:
  // Look up all entries in the bridgeDb where the "internal_channel" is the channel we spoke in
  // This will get us a list of channels linked to that internal channel.
  // For each entry, use the webhook to send a message to that external channel
  //
  // If the message comes from outside the guild:
  // Look up the first entry from the bridgeDb where the 'external_channel' is the channel we spoke in
  // Use that channel to know what internal_channel it is bridged with
  // Use internal_channel to look up all entries in the bridgeDb that match with "internal_channel"
  // This will get us a list of channels linked to that internal channel.
  // For each entry, use the webhook to send a message to that external channel

  // log.debug(F, 'Checking if message should be sent through bridge');

  // log.debug(F, `Bridge DB: ${JSON.stringify(bridgeDb, null, 2)}`);

  // Internal message
  if (message.guildId === env.DISCORD_GUILD_ID) {
    const internalBridgeDb = await database.bridges.get(message.channel.id);
    if (internalBridgeDb.length === 0) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, `Message is from tripsit in ${(message.channel as TextChannel).name}`);

    await Promise.all(internalBridgeDb.map(async bridge => {
      if (bridge.status === 'ACTIVE'
        && bridge.internal_channel === message.channel.id
      ) {
        await sendMessageToChannel(bridge.external_channel, message);
      }
    }));
  }

  // External message
  if (message.guildId !== env.DISCORD_GUILD_ID) {
    const externalBridgeDb = await database.bridges.get(message.channel.id);
    if (externalBridgeDb.length === 0) return; // If there is no bridge config for this channel then ignore the message
    const bridgeConfig = externalBridgeDb.find(bridge => bridge.status === 'ACTIVE');
    if (!bridgeConfig) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, `Message is from ${message.guild.name}'s ${(message.channel as TextChannel).name}`);

    await sendMessageToChannel(bridgeConfig.internal_channel, message);

    const internalBridgeDb = await database.bridges.get(bridgeConfig.internal_channel);
    await Promise.all(internalBridgeDb.map(async bridge => {
      if (bridge.status === 'ACTIVE'
        && bridge.external_channel.toString() !== message.channel.id.toString()
      ) {
        await sendMessageToChannel(bridge.external_channel, message);
      }
    }));
  }
}
