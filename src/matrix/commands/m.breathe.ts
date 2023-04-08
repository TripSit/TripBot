/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient } from 'matrix-bot-sdk';
import { breathe } from '../../global/commands/g.breathe';

export default mBreathe;

export const name = 'breathe';
export const description = 'calming breathing exercises.';
export const usage = '~breathe (1 | 2 | 3 | 4)';

const F = f(__filename);

async function mBreathe(roomId:string, event:any, choice:string | null):Promise<boolean> {
  const url = await breathe(choice);
  matrixClient.replyNotice(roomId, event, `Click on the image below:\n${url}`);
  return true;
}
