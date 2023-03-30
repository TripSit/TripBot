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

bridgeDb.push({
  internal_channel: '1052634261531926538',
  internal_webhook: 'https://discord.com/api/webhooks/1090804782748418060/7fHgdyvJ2246ZAKKPMbfXIQi2xWjrPW_blLse5B8jDqFDSIARrUzyMxienuT3KfkXE_y', // eslint-disable-line
  external_channel: '943599582921756732',
  external_webhook: 'https://discord.com/api/webhooks/1090804626602872882/Og7G5xBu48AN3tCXalUEsBRqf2PfYYnVIvKTcUOPvzFBH2yvy2uQkoCE2kRborRF6zeo', // eslint-disable-line
  status: 'active',
});

export async function bridgeMessage(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  // This is the bridge utility
  // It will check the database to see if the message was sent in a channel that is configured to be bridged
  // If it is, it will send the message to the external channel using a webhook integration
  log.debug(F, 'Checking if message should be sent through bridge');

  log.debug(F, `Bridge DB: ${JSON.stringify(bridgeDb, null, 2)}`);

  if (message.guildId === env.DISCORD_GUILD_ID) {
    log.debug(F, 'Message is from internal guild');
    // Internal message
    log.debug(F, `Message channel: ${message.channel.id}`);
    const bridgeConfig = bridgeDb.find(bridge => bridge.internal_channel.toString() === message.channel.id.toString());
    log.debug(F, `Bridge config: ${JSON.stringify(bridgeConfig, null, 2)}`);
    if (!bridgeConfig) return; // If there is no bridge config for this channel then ignore the message
    if (bridgeConfig.status === 'paused') return; // If the bridge is paused then ignore the message
    log.debug(F, 'Message should be sent through bridge');

    // Get the webhook for the external channel
    const webhookClient = new WebhookClient({ url: bridgeConfig.external_webhook });
    log.debug(F, `Sending message to ${bridgeConfig.external_channel} using webhook ${bridgeConfig.external_webhook}`);
    webhookClient.send({
      username: `${message.member?.displayName} (${message.guild.name})`,
      avatarURL: message.author.avatarURL() ?? undefined,
      content: message.content,
    });
  }

  if (message.guildId !== env.DISCORD_GUILD_ID) {
    log.debug(F, 'Message is from external guild');
    // External message
    log.debug(F, `Message channel: ${message.channel.id}`);
    const bridgeConfig = bridgeDb.find(bridge => bridge.external_channel.toString() === message.channel.id.toString());
    log.debug(F, `Bridge config: ${JSON.stringify(bridgeConfig, null, 2)}`);
    if (!bridgeConfig) return; // If there is no bridge config for this channel then ignore the message
    if (bridgeConfig.status === 'paused') return; // If the bridge is paused then ignore the message
    log.debug(F, 'Message should be sent through bridge');

    // Get the webhook for the external channel
    const webhookClient = new WebhookClient({ url: bridgeConfig.internal_webhook });
    log.debug(F, `Sending message to ${bridgeConfig.external_channel} using webhook ${bridgeConfig.internal_webhook}`);
    webhookClient.send({
      username: `${message.member?.displayName} (${message.guild.name})`,
      avatarURL: message.author.avatarURL() ?? undefined,
      content: message.content,
    });
  }
}
