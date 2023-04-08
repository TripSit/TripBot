/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient } from 'matrix-bot-sdk';
import { combochart } from '../../global/commands/g.combochart';

export default mCommand;

export const name = 'combochart';
export const description = 'Show our drug combination chart';
export const usage = '~combochart';

const F = f(__filename);

async function mCommand(roomId:string, event:any):Promise<boolean> {
  matrixClient.replyNotice(roomId, event, await combochart());
  log.debug(F, 'I did thing');
  return true;
}
