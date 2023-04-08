/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient } from 'matrix-bot-sdk';

export default mCommand;

export const name = 'command';
export const description = 'do stuff.';
export const usage = '~command <required_arg> [optional arg]';

const F = f(__filename);

async function mCommand(roomId:string, event:any):Promise<boolean> {
  matrixClient.replyNotice(roomId, event, 'Hello world!');
  log.debug(F, 'I did thing');
  return true;
}
