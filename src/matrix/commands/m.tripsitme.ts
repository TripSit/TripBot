/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient } from 'matrix-bot-sdk';
import tripsitme from '../utils/tripsitme';

export default mTripsitMe;

export const name = 'tripsitme';
export const description = 'Use this command if you need help.';
export const usage = 'tripsitme';

const F = f(__filename);

async function mTripsitMe(roomId:string, event:any, subcommand:string | null, tripsitee:string | null):Promise<boolean> {
  await tripsitme(roomId, event, subcommand, tripsitee);
  return true;
}
