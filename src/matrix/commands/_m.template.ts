/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient } from 'matrix-bot-sdk';

export default mCommand;

const F = f(__filename);

async function mCommand(roomId:string, event:any, client:MatrixClient):Promise<boolean> {
  client.replyNotice(roomId, event, 'Hello world!');
  log.debug(F, 'I did thing');
  return true;
}
