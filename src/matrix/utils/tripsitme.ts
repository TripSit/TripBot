/* eslint-disable */
import { MatrixClient } from 'matrix-bot-sdk';
import { Users } from '../../global/@types/database';
import { getUserAttribute } from '../../global/utils/keycloak';
import { getUser, ticketDel, ticketGet } from '../../global/utils/knex';

export default async function tripsitme(matrixClient:MatrixClient, roomId:string, event:any) {
  const tripsitee = event.sender;
  const user = await getUser(null, tripsitee, null);

  const ticketData = {
    userid: user.id,
    type: 'TRIPSIT',
    status: 'OPEN',
  };
}

async function createThread(matrixClient:MatrixClient, event:any, user:Users) {
  const localpart = (user.matrix_id as string).split(':')[0].substring(1);

  return matrixClient.createRoom({
    visibility: 'private',
    invite: [user.matrix_id as string],
    name: `🧡 ${localpart}'s room`,
  });
}

