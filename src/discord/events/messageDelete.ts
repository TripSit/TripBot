import {
  MessageDeleteEvent,
} from '../@types/eventDef';
import { relayDiscordDelete } from '../utils/chatBridge';
import { removeDeletedMessageCopies } from '../utils/deletedMessageCopies';

export const messageDelete: MessageDeleteEvent = {
  name: 'messageDelete',
  async execute(message) {
    relayDiscordDelete(message);
    removeDeletedMessageCopies(message);
  },
};

export default messageDelete;
