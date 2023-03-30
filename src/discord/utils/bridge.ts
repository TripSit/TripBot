import {
  Message, WebhookClient,
} from 'discord.js';

export default bridgeMessage;

const F = f(__filename);  // eslint-disable-line

type BridgeConfig = {
  internal_channel: string,
  internal_webhook: string,
  external_channel: string,
  external_webhook: string,
  status: 'paused' | 'active',
};

const bridgeDb = [] as BridgeConfig[];

bridgeDb.push({ // TS Dev
  internal_channel: '943599582921756732',
  internal_webhook: 'https://discord.com/api/webhooks/1091117433844146187/ZknkSupuJasdgvdd7_eV4N8vlF_48Tlhp0vevGsHGil_GjumpC-upy7vw_0i9rBylwgM', // eslint-disable-line
  external_channel: '1052634261531926538',
  external_webhook: 'https://discord.com/api/webhooks/1090804782748418060/7fHgdyvJ2246ZAKKPMbfXIQi2xWjrPW_blLse5B8jDqFDSIARrUzyMxienuT3KfkXE_y', // eslint-disable-line
  status: 'active',
});

bridgeDb.push({ // MB server
  internal_channel: '943599582921756732',
  internal_webhook: 'https://discord.com/api/webhooks/1091117433844146187/ZknkSupuJasdgvdd7_eV4N8vlF_48Tlhp0vevGsHGil_GjumpC-upy7vw_0i9rBylwgM', // eslint-disable-line
  external_channel: '1088437052439273605',
  external_webhook: 'https://discord.com/api/webhooks/1091100181937782925/nEDr9TNisCaj_sh_qqsn5QoZzY2ReuHCNfbIrR6i3apIQgjgvCXLRYvWGAcGquMM8HUC', // eslint-disable-line
  status: 'active',
});

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
    if (message.guild.id !== '1088437051134857336' && message.guild.id !== '960606557622657026') return;
    log.debug(F, 'Message is from internal guild');
    log.debug(F, `Message channel: ${message.channel.id}`);
    const webhooks = [] as WebhookClient[];
    bridgeDb
      .forEach(bridge => {
        if (bridge.internal_channel === message.channel.id
          && bridge.status === 'active'
        ) {
          webhooks.push(new WebhookClient({ url: bridge.external_webhook }));
        }
      });
    if (webhooks.length === 0) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, 'Message should be sent through bridge');
    // log.debug(F, `webhooks: ${JSON.stringify(webhooks, null, 2)}`);

    webhooks.forEach(client => {
      // log.debug(F, `Client: ${JSON.stringify(client, null, 2)}`);
      client.send({
        username: `${message.member?.displayName} (${message.guild?.name})`,
        avatarURL: message.author.avatarURL() ?? undefined,
        content: message.content,
      });
    });
  }

  // External message
  if (message.guildId !== env.DISCORD_GUILD_ID) {
    if (message.guild.id !== '1088437051134857336' && message.guild.id !== '960606557622657026') return;
    log.debug(F, 'Message is from external guild');
    log.debug(F, `Message channel: ${message.channel.id}`);
    const bridgeConfig = bridgeDb.find(bridge => bridge.external_channel.toString() === message.channel.id.toString()
    && bridge.status === 'active');
    if (!bridgeConfig) return; // If there is no bridge config for this channel then ignore the message
    log.debug(F, 'Message should be sent through bridge');
    // log.debug(F, `Bridge config: ${JSON.stringify(bridgeConfig, null, 2)}`);

    const webhooks = [] as WebhookClient[];
    webhooks.push(new WebhookClient({ url: bridgeConfig.internal_webhook }));
    bridgeDb
      .forEach(bridge => {
        if (bridge.internal_channel === bridgeConfig.internal_channel
          && bridge.status === 'active'
          && bridge.external_channel.toString() !== message.channel.id.toString()) {
          webhooks.push(new WebhookClient({ url: bridge.external_webhook }));
        }
        return null;
      });

    log.debug(F, `webhooks: ${JSON.stringify(webhooks, null, 2)}`);

    webhooks.forEach(client => {
      if (client === null) return;
      log.debug(F, `Client: ${JSON.stringify(client, null, 2)}`);
      client.send({
        username: `${message.member?.displayName} (${message.guild?.name})`,
        avatarURL: message.author.avatarURL() ?? undefined,
        content: message.content,
      });
    });
  }
}
