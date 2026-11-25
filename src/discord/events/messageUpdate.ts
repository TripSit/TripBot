import {
  MessageUpdateEvent,
} from '../@types/eventDef';
import { relayDiscordEdit } from '../utils/chatBridge';

export const messageUpdate: MessageUpdateEvent = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    relayDiscordEdit(oldMessage, newMessage);
  },
};

export default messageUpdate;
