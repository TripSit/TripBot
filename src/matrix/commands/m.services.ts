/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient } from 'matrix-bot-sdk';

export default mServices;

export const name = 'services';
export const description = 'A list of our Services publicly available for the sake of harm reduction.';
export const usage = '~services';

const F = f(__filename);

async function mServices(roomId:string, event:any):Promise<boolean> {
  matrixClient.replyNotice(roomId, event, 'Hello world!');
  log.debug(F, 'I did thing');
  return true;
}
