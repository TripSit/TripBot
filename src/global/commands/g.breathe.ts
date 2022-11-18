import { parse } from 'path';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default breathe;

/**
 * Returns one of the breaking exercises
 * @param {string | null} choice Which exercise to return
 */
export async function breathe(choice:string | null):Promise<string> {
  let response = 'https://i.imgur.com/n5jBp45.gif';
  if (choice === '1') response = 'https://i.imgur.com/n5jBp45.gif';
  if (choice === '2') response = 'https://i.imgur.com/XbH6gP4.gif';
  if (choice === '3') response = 'https://i.imgur.com/g57i96f.gif';
  if (choice === '4') response = 'https://i.imgur.com/MkUcTPl.gif';
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
