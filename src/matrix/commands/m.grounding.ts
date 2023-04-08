/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient } from 'matrix-bot-sdk';
import { grounding } from '../../global/commands/g.grounding';

export default mGrounding;

export const name = 'grounding';
export const description = 'show the 5-senses grounding exercise';
export const usage = '~grounding';

const F = f(__filename);

async function mGrounding(roomId:string, event:any):Promise<boolean> {
  matrixClient.replyNotice(roomId, event, await grounding());
  return true;
}
