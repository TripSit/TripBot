import {
  Message, MessageMentionTypes, TextChannel, Webhook, WebhookClient,
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

  // log.debug(F, 'Checking if message should be sent through bridge');

  // log.debug(F, `Bridge DB: ${JSON.stringify(bridgeDb, null, 2)}`);

  // Internal message
  if (message.guildId === env.DISCORD_GUILD_ID) {
    const internalBridgeDb = await database.bridges.get(message.channel.id);
    if (internalBridgeDb.length === 0) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, `Message is from tripsit in ${(message.channel as TextChannel).name}`);

    const webhooks = [] as WebhookClient[];
    for (const bridge of internalBridgeDb) { // eslint-disable-line no-restricted-syntax
      if (bridge.status === 'ACTIVE'
        && bridge.internal_channel === message.channel.id
      ) {
        // eslint-disable-next-line no-await-in-loop
        const externalChannel = await message.client.channels.fetch(bridge.external_channel) as TextChannel;
        const webhookData = await externalChannel.fetchWebhooks() // eslint-disable-line no-await-in-loop
          .then(webhookList => webhookList.find(webhook => webhook.name === tripsitBridgeName))
          ?? await externalChannel.createWebhook({ // eslint-disable-line no-await-in-loop
            name: tripsitBridgeName,
            reason: tripsitBridgeName,
          })
            .then(async () => { // eslint-disable-line @typescript-eslint/no-loop-func
              log.debug(F, 'Created new webhook');
              const updatedWebhookList = await externalChannel.fetchWebhooks();
              return updatedWebhookList.find(webhook => webhook.name === tripsitBridgeName);
            }) as Webhook;
        // log.debug(F, `Webhook: ${JSON.stringify(webhookData, null, 2)}`);
        log.debug(F, `Webhook: ${JSON.stringify(webhookData.url, null, 2)}`);
        webhooks.push(new WebhookClient({ url: webhookData.url }));
      }
    }
    if (webhooks.length === 0) return; // If there is no bridge config for this channel then ignore the message
    // log.debug(F, 'Message should be sent through bridge');

    webhooks.forEach(client => {
      log.debug(F, `Sending message to ${client.url}`);
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
    const externalBridgeDb = await database.bridges.get(message.channel.id);
    if (externalBridgeDb.length === 0) return; // If there is no bridge config for this channel then ignore the message
    const bridgeConfig = externalBridgeDb.find(bridge => bridge.status === 'ACTIVE');
    if (!bridgeConfig) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, `Message is from ${message.guild.name}'s ${(message.channel as TextChannel).name}`);

    const tripsitChannel = await message.client.channels.fetch(bridgeConfig.internal_channel) as TextChannel;
    const tripsitWebhookData = await tripsitChannel.fetchWebhooks()
      .then(webhookList => webhookList.find(webhook => webhook.name === tripsitBridgeName))
      ?? await tripsitChannel.createWebhook({
        name: tripsitBridgeName,
        reason: tripsitBridgeName,
      })
        .then(async () => {
          const updatedWebhookList = await tripsitChannel.fetchWebhooks();
          return updatedWebhookList.find(webhook => webhook.name === tripsitBridgeName);
        }) as Webhook;
    log.debug(F, `Tripsit webhook: ${JSON.stringify(tripsitWebhookData.url, null, 2)} `);

    const webhooks = [] as WebhookClient[];
    webhooks.push(new WebhookClient({ url: tripsitWebhookData.url }));
    const internalBridgeDb = await database.bridges.get(bridgeConfig.internal_channel);
    for (const bridge of internalBridgeDb) { // eslint-disable-line no-restricted-syntax
      if (bridge.status === 'ACTIVE'
        && bridge.external_channel.toString() !== message.channel.id.toString()
      ) {
        // eslint-disable-next-line no-await-in-loop
        const externalChannel = await message.client.channels.fetch(bridge.external_channel) as TextChannel;
        const webhookData = await externalChannel.fetchWebhooks() // eslint-disable-line no-await-in-loop
          .then(webhookList => webhookList.find(webhook => webhook.name === tripsitBridgeName))
          ?? await externalChannel.createWebhook({ // eslint-disable-line no-await-in-loop
            name: tripsitBridgeName,
            reason: tripsitBridgeName,
          })
            .then(async () => { // eslint-disable-line
              log.debug(F, 'Created new webhook');
              const updatedWebhookList = await externalChannel.fetchWebhooks();
              return updatedWebhookList.find(webhook => webhook.name === tripsitBridgeName);
            }) as Webhook;
        // log.debug(F, `Webhook: ${JSON.stringify(webhookData, null, 2)}`);
        log.debug(F, `Webhook: ${JSON.stringify(webhookData.url, null, 2)}`);
        webhooks.push(new WebhookClient({ url: webhookData.url }));
      }
    }
    // bridgeDb
    //   .forEach(async bridge => {
    //     if (bridge.status === 'ACTIVE'
    //       && bridge.external_channel.toString() !== message.channel.id.toString()) {
    //       const channel = await message.client.channels.fetch(bridge.external_channel) as TextChannel;
    //       const webhookData = await channel.fetchWebhooks()
    //         .then(webhookList => webhookList.find(webhook => webhook.name === tripsitBridgeName))
    //         ?? await channel.createWebhook({
    //           name: tripsitBridgeName,
    //           reason: tripsitBridgeName,
    //         })
    //           .then(async () => {
    //             const updatedWebhookList = await (message.channel as TextChannel).fetchWebhooks();
    //             return updatedWebhookList.find(webhook => webhook.name === tripsitBridgeName);
    //           }) as Webhook;
    //       webhooks.push(new WebhookClient({ url: webhookData.url }));
    //     }
    //     return null;
    //   });

    webhooks.forEach(async client => {
      log.debug(F, `Sending message to ${client.url}`);
      await client.send({
        username: `${message.member?.displayName} (${message.guild?.name})`,
        avatarURL: message.author.avatarURL() ?? undefined,
        content: message.content,
        files: message.attachments.size > 0 ? message.attachments.map(attachment => attachment.url) : undefined,
        allowedMentions: { parse: ['users', 'roles'] as MessageMentionTypes[] },
      });
      // log.debug(F, `Success: ${JSON.stringify(success, null, 2)}`);
    });
  }
}
