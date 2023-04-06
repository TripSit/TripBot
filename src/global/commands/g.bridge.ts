import { Bridges, BridgeStatus } from '../@types/database';
import { database } from '../utils/knex';

const F = f(__filename);

const noBridgeError = 'Error: Bridge does not exist!';

export async function bridgeCreate(
  internalChannel: string,
  externalChannel: string,
  override: boolean,
):Promise<string> {
  log.debug(F, `bridgeCreate: ${internalChannel} <> ${externalChannel}`);

  const [existingBridge] = await database.bridges.get(externalChannel);
  log.debug(F, `existingBridge: ${JSON.stringify(existingBridge, null, 2)}`);

  if (existingBridge && existingBridge.status === 'PENDING' && !override) {
    log.debug(F, `bridgeCreate: ${JSON.stringify(existingBridge, null, 2)}`);
    return 'Error: Bridge already pending! Use the override if you\'re sure!';
  }

  await database.bridges.set([{
    internal_channel: internalChannel,
    external_channel: externalChannel,
    status: 'PENDING' as BridgeStatus,
  } as Bridges]);

  return 'Initialized bridge!';
}

export async function bridgeConfirm(
  externalChannel: string,
):Promise<string> {
  // To confirm the bridge, first get the existing bridge that matches the external guild and channel
  const [existingBridge] = await database.bridges.get(externalChannel);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  // Then update the bridge with the external webhook
  await database.bridges.set([{
    ...existingBridge,
    status: 'ACTIVE' as BridgeStatus,
  } as Bridges]);
  return existingBridge.internal_channel;
}

export async function bridgePause(
  channelId: string,
):Promise<string> {
  const [existingBridge] = await database.bridges.get(channelId);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  await database.bridges.set([{
    ...existingBridge,
    status: 'PAUSED' as BridgeStatus,
  } as Bridges]);

  return 'Paused bridge';
}

export async function bridgeResume(
  channelId: string,
):Promise<string> {
  const [existingBridge] = await database.bridges.get(channelId);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  await database.bridges.set([{
    ...existingBridge,
    status: 'ACTIVE' as BridgeStatus,
  } as Bridges]);

  return 'Activated bridge';
}

export async function bridgeRemove(
  channelId: string,
):Promise<string> {
  const [existingBridge] = await database.bridges.get(channelId);

  if (existingBridge === undefined) {
    return noBridgeError;
  }

  await database.bridges.del([existingBridge]);

  return 'Removed bridge';
}
