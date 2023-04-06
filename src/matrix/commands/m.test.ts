import { MatrixClient } from 'matrix-bot-sdk';
import {
  // findUser,
  getRoleMembers,
  // hasRole,
} from '../../global/utils/keycloak';

export default test;

export const name = 'test';
export const description = ' ';
export const usage = ' ';

async function test(roomId:string, event:any, matrixClient:MatrixClient, id:string):Promise<Boolean> {
  matrixClient.replyHtmlNotice(roomId, event, `<code> ${JSON.stringify(await getRoleMembers(id))}</code>`);
  return true;
}
