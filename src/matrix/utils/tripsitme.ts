import { MatrixClient } from 'matrix-bot-sdk';
import { getUserAttribute } from '../../global/utils/keycloak';

export default async function tripsitme(client:MatrixClient, roomId:string, event:any) {
  const tripsitee = event.sender;
  const localpart = tripsitee.split(':')[0].substring(1);
}
