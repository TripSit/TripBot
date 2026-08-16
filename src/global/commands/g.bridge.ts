const F = f(__filename);

const noBridgeError = 'Error: Bridge does not exist!';

export async function bridgeCreate(
  internalChannel: string,
  externalChannel: string,
  override: boolean,
):Promise<string> {
  log.debug(F, `bridgeCreate: ${internalChannel} <> ${externalChannel}`);

  const existingBridge = await db.bridges.findFirst({
    where: {
      external_channel: externalChannel,
    },
  });
  log.debug(F, `existingBridge: ${JSON.stringify(existingBridge, null, 2)}`);

  if (existingBridge && existingBridge.status === 'PENDING' && !override) {
    log.info(F, `bridgeCreate: bridge ${internalChannel} <> ${externalChannel} already pending, override not set`);
    return 'Error: Bridge already pending! Use the override if you\'re sure!';
  }

  await db.bridges.upsert({
    where: {
      internal_channel_external_channel: {
        internal_channel: internalChannel,
        external_channel: externalChannel,
      },
    },
    create: {
      internal_channel: internalChannel,
      external_channel: externalChannel,
      status: 'PENDING',
    },
    update: {
      internal_channel: internalChannel,
      external_channel: externalChannel,
      status: 'PENDING',
    },
  });

  return 'Initialized bridge!';
}

export async function bridgeConfirm(
  externalChannel: string,
):Promise<string> {
  log.debug(F, `bridgeConfirm: ${externalChannel}`);

  // To confirm the bridge, first get the existing bridge that matches the external guild and channel
  const existingBridge = await db.bridges.findFirst({
    where: {
      external_channel: externalChannel,
    },
  });

  if (!existingBridge) {
    log.warn(F, `bridgeConfirm: no bridge found for ${externalChannel}`);
    return noBridgeError;
  }

  await db.bridges.update({
    where: {
      internal_channel_external_channel: {
        internal_channel: existingBridge.internal_channel,
        external_channel: existingBridge.external_channel,
      },
    },
    data: {
      status: 'ACTIVE',
    },
  });

  log.info(F, `bridgeConfirm: confirmed bridge ${existingBridge.internal_channel} <> ${externalChannel}`);
  return existingBridge.internal_channel;
}

export async function bridgePause(
  channelId: string,
):Promise<string> {
  log.debug(F, `bridgePause: ${channelId}`);

  let existingBridge = await db.bridges.findFirst({
    where: {
      external_channel: channelId,
    },
  });

  if (!existingBridge) {
    existingBridge = await db.bridges.findFirst({
      where: {
        internal_channel: channelId,
      },
    });
  }

  if (!existingBridge) {
    log.warn(F, `bridgePause: no bridge found for ${channelId}`);
    return noBridgeError;
  }

  await db.bridges.update({
    where: {
      internal_channel_external_channel: {
        internal_channel: existingBridge.internal_channel,
        external_channel: existingBridge.external_channel,
      },
    },
    data: {
      status: 'PAUSED',
    },
  });

  log.info(F, `bridgePause: paused bridge ${existingBridge.internal_channel} <> ${existingBridge.external_channel}`);
  return 'Paused bridge';
}

export async function bridgeResume(
  channelId: string,
):Promise<string> {
  log.debug(F, `bridgeResume: ${channelId}`);

  let existingBridge = await db.bridges.findFirst({
    where: {
      external_channel: channelId,
    },
  });

  if (!existingBridge) {
    existingBridge = await db.bridges.findFirst({
      where: {
        internal_channel: channelId,
      },
    });
  }

  if (!existingBridge) {
    log.warn(F, `bridgeResume: no bridge found for ${channelId}`);
    return noBridgeError;
  }

  await db.bridges.update({
    where: {
      internal_channel_external_channel: {
        internal_channel: existingBridge.internal_channel,
        external_channel: existingBridge.external_channel,
      },
    },
    data: {
      status: 'ACTIVE',
    },
  });

  const { internal_channel: internalChannel, external_channel: bridgedChannel } = existingBridge;
  log.info(F, `bridgeResume: activated bridge ${internalChannel} <> ${bridgedChannel}`);
  return 'Activated bridge';
}

export async function bridgeRemove(
  channelId: string,
):Promise<string> {
  log.debug(F, `bridgeRemove: ${channelId}`);

  let existingBridge = await db.bridges.findFirst({
    where: {
      external_channel: channelId,
    },
  });

  if (!existingBridge) {
    existingBridge = await db.bridges.findFirst({
      where: {
        internal_channel: channelId,
      },
    });
  }

  if (!existingBridge) {
    log.warn(F, `bridgeRemove: no bridge found for ${channelId}`);
    return noBridgeError;
  }

  await db.bridges.delete({
    where: {
      internal_channel_external_channel: {
        internal_channel: existingBridge.internal_channel,
        external_channel: existingBridge.external_channel,
      },
    },
  });

  log.info(F, `bridgeRemove: removed bridge ${existingBridge.internal_channel} <> ${existingBridge.external_channel}`);
  return 'Removed bridge';
}
