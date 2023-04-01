import { Bridges, BridgeStatus } from '../@types/database';
import { database } from '../utils/knex';

const F = f(__filename);

const noBridgeError = 'Error: Bridge does not exist!';

export async function bridgeCreate(
  internalChannel: string,
  internalWebhook: string,
  externalGuild: string,
  externalChannel: string,
  override: boolean,
):Promise<string> {
  log.debug(F, `bridgeCreate: ${internalChannel} <> ${externalChannel} using ${internalWebhook}`);

  const [existingBridge] = await database.bridges.get(internalChannel, externalGuild, null);
  log.debug(F, `existingBridge: ${JSON.stringify(existingBridge, null, 2)}`);

  if (existingBridge !== undefined && !override) {
    log.debug(F, `bridgeCreate: ${JSON.stringify(existingBridge, null, 2)}`);
    return 'Error: Bridge already started! Use the override if you\'re sure!';
  }

  await database.bridges.set({
    internal_channel: internalChannel,
    internal_webhook: internalWebhook,
    external_guild: externalGuild,
    external_channel: externalChannel,
    external_webhook: null,
    status: 'ACTIVE' as BridgeStatus,
  } as Bridges);

  return 'Initialized bridge!';
}

export async function bridgeConfirm(
  externalGuild: string,
  externalChannel: string,
  externalWebhook: string,
):Promise<string> {
  // To confirm the bridge, first get the existing bridge that matches the external guild and channel
  const [existingBridge] = await database.bridges.get(null, externalGuild, externalChannel);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  // Then update the bridge with the external webhook
  const bridgeData = await database.bridges.set({
    ...existingBridge,
    external_webhook: externalWebhook,
  } as Bridges);
  return bridgeData.internal_channel;
}

export async function bridgePause(
  internalChannel: string,
  externalChannel: string,
):Promise<string> {
  const [existingBridge] = await database.bridges.get(internalChannel, null, externalChannel);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  await database.bridges.set({
    ...existingBridge,
    status: 'PAUSED' as BridgeStatus,
  } as Bridges);

  return 'Paused bridge';
}

export async function bridgeResume(
  internalChannel: string,
  externalChannel: string,
):Promise<string> {
  const [existingBridge] = await database.bridges.get(internalChannel, null, externalChannel);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  await database.bridges.set({
    ...existingBridge,
    status: 'ACTIVE' as BridgeStatus,
  } as Bridges);

  return 'Activated bridge';
}

export async function bridgeRemove(
  internalChannel: string,
  externalChannel: string,
):Promise<string> {
  const [existingBridge] = await database.bridges.get(internalChannel, null, externalChannel);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  await database.bridges.del(existingBridge);

  return 'Removed bridge';
}
