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
    log.debug(F, `bridgeCreate: ${JSON.stringify(existingBridge, null, 2)}`);
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
  // To confirm the bridge, first get the existing bridge that matches the external guild and channel
  const existingBridge = await db.bridges.findFirst({
    where: {
      external_channel: externalChannel,
    },
  });

  if (!existingBridge) {
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

  return existingBridge.internal_channel;
}

export async function bridgePause(
  channelId: string,
):Promise<string> {
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

  return 'Paused bridge';
}

export async function bridgeResume(
  channelId: string,
):Promise<string> {
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

  return 'Activated bridge';
}

export async function bridgeRemove(
  channelId: string,
):Promise<string> {
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

  return 'Removed bridge';
}
