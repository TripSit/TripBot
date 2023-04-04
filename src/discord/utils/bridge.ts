import {
  Message, MessageMentionTypes, TextChannel, WebhookClient,
} from 'discord.js';
import { database } from '../../global/utils/knex';

export default bridgeMessage;

const F = f(__filename);  // eslint-disable-line

const tripsitBridgeName = 'Tripsit Bridge';

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

  log.debug(F, 'Checking if message should be sent through bridge');

  // log.debug(F, `Bridge DB: ${JSON.stringify(bridgeDb, null, 2)}`);

  // Internal message
  if (message.guildId === env.DISCORD_GUILD_ID) {
    log.debug(F, 'Message is from tripsit');
    log.debug(F, `Message channel: ${message.channel.id}`);
    const webhooks = [] as WebhookClient[];
    const bridges = await database.bridges.get(message.channel.id);

    bridges
      .forEach(async bridge => {
        if (bridge.internal_channel === message.channel.id
          && bridge.status === 'ACTIVE'
        ) {
          const channel = await message.client.channels.fetch(bridge.external_channel) as TextChannel;
          const webhookData = await channel.fetchWebhooks()
            .then(webhookList => webhookList.find(webhook => webhook.name === tripsitBridgeName))
            ?? await channel.createWebhook({
              name: tripsitBridgeName,
              reason: tripsitBridgeName,
            });

          webhooks.push(new WebhookClient({ url: webhookData.url }));
        }
      });
    if (webhooks.length === 0) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, 'Message should be sent through bridge');
    // log.debug(F, `webhooks: ${JSON.stringify(webhooks, null, 2)}`);

    // log.debug(F, `Message: ${JSON.stringify(message, null, 2)}`);

    webhooks.forEach(client => {
      client.send({
        username: `${message.member?.displayName} (${message.guild?.name})`,
        avatarURL: message.author.avatarURL() ?? undefined,
        content: message.content,
        files: message.attachments.size > 0 ? message.attachments.map(attachment => attachment.url) : undefined,
        allowedMentions: { parse: ['users', 'roles'] as MessageMentionTypes[] },
      });
    });
  }

  // External message
  if (message.guildId !== env.DISCORD_GUILD_ID) {
    log.debug(F, 'Message is from external guild');
    log.debug(F, `Message channel: ${message.channel.id}`);
    const bridges = await database.bridges.get(message.channel.id);

    const bridgeConfig = bridges.find(bridge => bridge.status === 'ACTIVE');
    if (!bridgeConfig) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, 'Message should be sent through bridge');
    log.debug(F, `Bridge config: ${JSON.stringify(bridgeConfig, null, 2)}`);

    const tripsitWebhookData = await (message.channel as TextChannel).fetchWebhooks()
      .then(webhookList => webhookList.find(webhook => webhook.name === tripsitBridgeName))
      ?? await (message.channel as TextChannel).createWebhook({
        name: tripsitBridgeName,
        reason: tripsitBridgeName,
      });

    const webhooks = [] as WebhookClient[];
    webhooks.push(new WebhookClient({ url: tripsitWebhookData.url }));

    const bridgeDb = await database.bridges.get(bridgeConfig.internal_channel);

    bridgeDb
      .forEach(async bridge => {
        if (bridge.status === 'ACTIVE'
          && bridge.external_channel.toString() !== message.channel.id.toString()) {
          const channel = await message.client.channels.fetch(bridge.external_channel) as TextChannel;
          const webhookData = await channel.fetchWebhooks()
            .then(webhookList => webhookList.find(webhook => webhook.name === tripsitBridgeName))
            ?? await channel.createWebhook({
              name: tripsitBridgeName,
              reason: tripsitBridgeName,
            });
          webhooks.push(new WebhookClient({ url: webhookData.url }));
        }
        return null;
      });

    webhooks.forEach(async client => {
      log.debug(F, `Client: ${JSON.stringify(client, null, 2)}`);
      const success = await client.send({
        username: `${message.member?.displayName} (${message.guild?.name})`,
        avatarURL: message.author.avatarURL() ?? undefined,
        content: message.content,
        files: message.attachments.size > 0 ? message.attachments.map(attachment => attachment.url) : undefined,
        allowedMentions: { parse: ['users', 'roles'] as MessageMentionTypes[] },
      });
      log.debug(F, `Success: ${JSON.stringify(success, null, 2)}`);
    });
  }
}
