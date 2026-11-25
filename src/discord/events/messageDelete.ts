import {
  MessageDeleteEvent,
} from '../@types/eventDef';
import { relayDiscordDelete } from '../utils/chatBridge';

export const messageDelete: MessageDeleteEvent = {
  name: 'messageDelete',
  async execute(message) {
    relayDiscordDelete(message);
  },
};

export default messageDelete;
