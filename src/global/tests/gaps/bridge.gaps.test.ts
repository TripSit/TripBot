import {
  registerBridgeTarget, relayDeletion, relayMessage, unregisterBridgeTarget,
} from '../../bridge/bridge';
import { setMappings } from '../../bridge/bridge.mappings';
import { mappingRow } from '../../../vitest/utils/bridgeMappings';

const GENERAL_ID = 'discord-general';

afterEach(() => {
  setMappings([]);
  unregisterBridgeTarget('matrix');
  unregisterBridgeTarget('irc');
});

describe('bridge targets without a matching channel', () => {
  it('skips platforms that have no channel for the gateway', async () => {
    setMappings([mappingRow({
      discord_channel_id: GENERAL_ID, irc_channel: '#general', gateway_name: 'General', matrix_room_id: null,
    })]);
    const matrixSend = vi.fn().mockResolvedValue(undefined);
    const matrixRemove = vi.fn().mockResolvedValue(undefined);
    const ircSend = vi.fn().mockResolvedValue(undefined);
    registerBridgeTarget({ platform: 'matrix', send: matrixSend, remove: matrixRemove });
    registerBridgeTarget({ platform: 'irc', send: ircSend });

    // #general is bridged to Discord and IRC but has no Matrix room
    await relayMessage({
      platform: 'discord', channel: GENERAL_ID, nick: 'Moonbear', text: 'hello',
    });
    expect(ircSend).toHaveBeenCalledWith('#general', expect.objectContaining({ text: 'hello' }));
    expect(matrixSend).not.toHaveBeenCalled();

    await relayDeletion({ platform: 'discord', channel: GENERAL_ID, id: 'm1' });
    expect(matrixRemove).not.toHaveBeenCalled();
  });
});
