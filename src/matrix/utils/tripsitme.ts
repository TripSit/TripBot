/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { TicketStatus, Users, UserTickets } from '../../global/@types/database';
import {
  getRoleMembers, getUserAttribute, getUserRoleMappings, hasRole,
} from '../../global/utils/keycloak';
import {
  getOpenTicket,
  getUser, ticketDel, ticketGet, ticketUpdate,
} from '../../global/utils/knex';

const F = f(__filename);

/**
 * create a new tripsit thread
 *
 * @param {any} event
 * @param {Users} user
 */
async function createRoom(event:any, user:Users):Promise<string> {
  const localpart = (user.matrix_id as string).split(':')[0].substring(1);

  const roomId = await matrixClient.createRoom({
    visibility: 'private',
    invite: [user.matrix_id as string],
    name: `🧡 ${localpart}'s room`,
  });

  const deleteTime = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));

  const ticketData = {
    user_id: user.id,
    description: '',
    thread_id: roomId,
    type: 'TRIPSIT',
    status: 'OPEN',
    first_message_id: '',
    archived_at: deleteTime,
    deleted_at: deleteTime,
  } as UserTickets;

  await ticketUpdate(ticketData);

  return roomId;
}

/**
 * send the initial message to the user
 * @param {string} roomId
 * @param {any} event
 * @param {string} tripsitee
 */
async function greetUser(roomId:string, event:any, tripsitee:string):Promise<void> {
  const text = `Hey ${tripsitee},\n Thank you for asking for assistance! <3\nOne of our Helpers/Tripsitters will be with you as soon as they're available.\nIn the meantime, you can tell us what you might have taken (when and how much of it) and whatever else you want to share.\n\nIf this is a medical emergency, please contact your local Emergency Services. We can not give any medical advice and we can not call emergency services on behalf of anyone!`;
  const html = `Hey ${tripsitee} 👋,<br> Thank you for asking for assistance! <3<br>One of our Helpers/Tripsitters will be with you as soon as they're available. ❤️<br><br>👉 In the meantime, you can tell us what you might have taken (when and how much of it) and whatever else you want to share.<br><br>🚑 If this is a medical emergency, please contact your local Emergency Services. We can not give any medical advice and we can not call emergency services on behalf of anyone!`;
  const messageEvent = {
    body: text,
    formatted_body: html,
    msgtype: 'm.text',
    format: 'org.matrix.custom.html',
  };
  await matrixClient.sendEvent(roomId, 'm.room.message', messageEvent);
}

/**
 * Invite the helpers an tripsitters to the newly created room
 * @param roomId
 * @returns {Promise<String>}
 */
async function inviteHelperteam(roomId: string):Promise<void> {
  const [helperRoleMembers, tripsitterRoleMembers] = await Promise.all([getRoleMembers('helper'), getRoleMembers('tripsitter')]);
  const matrixIds = [...helperRoleMembers, ...tripsitterRoleMembers].map(username => `@${username}:tripsit.me`);
  await Promise.all(matrixIds.map(matrixId => matrixClient.inviteUser(matrixId, roomId)));
}

async function ownTicket(event:any, roomId:string, tripsitee:string | null):Promise<void> {
  let text:string;
  let html:string;
  let reply:RichReply;
  if (tripsitee === null) {
    text = 'Please mention a user in your command!';
    html = '❌ Please mention a user in your command! ❌ ';
    return;
  }
  const localpart = tripsitee.split(':')[0].substring(1);
  const senderLocalpart = event.sender.split(':')[0].substring(1);

  if (await hasRole(senderLocalpart, 'tripsitter') === false && await hasRole(senderLocalpart, 'helper') === false) {
    text = "You're not a Helper/Tripsitter and therefore not allowed to own a ticket.";
    html = "❌ You're not a Helper/Tripsitter and therefore not allowed to own a ticket. ❌";
    reply = RichReply.createFor(roomId, event, text, html);
    matrixClient.sendMessage(roomId, reply);
  }
  const userData = await getUser(null, tripsitee, null);
  const ticketData = await getOpenTicket(userData.id, null);
  if (ticketData !== undefined) {
    (ticketData as UserTickets).status = 'OWNED' as TicketStatus;
    await ticketUpdate(ticketData as UserTickets);

    matrixClient.sendStateEvent(ticketData.thread_id, 'm.room.name', '', { name: `💛 | ${localpart}'s room.` });

    text = `You've indicated that someone is taking care of ${tripsitee}'s ticket!`;
    html = `✅ You've indicated that someone is taking care of ${tripsitee}'s ticket!`;
    reply = RichReply.createFor(roomId, event, text, html);
    matrixClient.sendMessage(roomId, reply);

    const tripsitHTML = 'Your ticket got claimed by one of our TripSitters/Helpers. They will be with you. ❤️';
    const tripsitText = 'Your ticket got claimed by one of our TripSitters/Helpers. They will be with you.';
    const tripsitMessageEvent = {
      body: tripsitText,
      formatted_body: tripsitHTML,
      msgtype: 'm.text',
      format: 'org.matrix.custom.html',
    };
    await matrixClient.sendEvent(ticketData.thread_id, 'm.room.message', tripsitMessageEvent);
  } else {
    text = 'I could not find an open tripsit ticket for this user.';
    html = '❌ I could not find an open tripsit ticket for this user. ❌';
    reply = RichReply;
  }
}

/**
 * ~tripsit off (<user>)
 * @param {string} target
 */
async function closeTicket(roomId:string, event:any, target: string | null):Promise<void> {
  const localpart = event.sender.split(':')[0].substring(1);
  let text:string;
  let html:string;
  let reply:RichReply;

  if (target !== event.sender && !await hasRole(localpart, 'tripsitter') && !await hasRole(localpart, 'helper')) {
    text = 'You are not a Tripsitter/Helper and therefore not allowed to close a ticket of somebody else.';
    html = '❌ You are not a Tripsitter/Helper and therefore not allowed to close a ticket of somebody else. ❌';
    reply = RichReply.createFor(roomId, event, text, html);
    await matrixClient.sendMessage(roomId, reply);
  }

  const ticketData = await getOpenTicket((await getUser(null, target, null)).id, null);

  if (ticketData !== undefined) {
    ticketData.status = 'CLOSED' as TicketStatus;
    ticketUpdate(ticketData);
  } else {
    text = `${target} does not currently have an open TripSit-Ticket!`;
    html = `❌ ${target} does not currently have an open TripSit-Ticket! ❌`;
    reply = RichReply.createFor(roomId, event, text, html);
    await matrixClient.sendMessage(roomId, reply);
  }
}

/**
 *
 * @param {string} roomId
 * @param {any} event
 * @param {string|null} subcommand subcommand (optional)
 * @param {string|null} target matrixID of the tripsitee (optional)
 */
export default async function tripsitme(roomId:string, event:any, subcommand:string | null, target:string | null):Promise<void> {
  let tripsitee;
  if (!target) {
    tripsitee = event.sender;
  } else {
    tripsitee = target;
  }
  const user = await getUser(null, tripsitee, null);
  const localpart = (user.matrix_id as string).split(':')[0].substring(1);

  switch (subcommand?.toLowerCase()) {
    case 'off':
      if (!target) {
        // eslint-disable-next-line no-param-reassign
        target = event.sender;
      }

      await closeTicket(roomId, event, target);
      break;
    case 'own':
      await ownTicket(event, roomId, target);
      break;

    default:
      const tripsitRoom = await createRoom(event, user);
      await greetUser(tripsitRoom, event, localpart);
      await inviteHelperteam(tripsitRoom);
      break;
  }
}
