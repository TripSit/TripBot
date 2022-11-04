import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Returns one of the breaking exercises
 * @param {string | null} choice Which exercise to return
 */
export async function breathe(choice:string | null):Promise<string> {
  let response = 'https://i.imgur.com/n5jBp45.gif';
  switch (choice) {
    case undefined:
      response = 'https://i.imgur.com/n5jBp45.gif';
    case '1':
      response = 'https://i.imgur.com/n5jBp45.gif';
    case '2':
      response = 'https://i.imgur.com/XbH6gP4.gif';
    case '3':
      response = 'https://i.imgur.com/g57i96f.gif';
    case '4':
      response = 'https://i.imgur.com/MkUcTPl.gif';
    default:
      response = 'https://i.imgur.com/n5jBp45.gif';
  }
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
