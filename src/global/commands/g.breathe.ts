import {stripIndents} from 'common-tags';
import env from '../utils/env.config';
import logger from '../utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 * Returns one of the breaking exercises
 * @return {string} choice Which exercise to return
 */
 export async function breathe(choice:string | null):Promise<string> {
  switch (choice) {
    case undefined:
      return 'https://i.imgur.com/n5jBp45.gif';
    case '1':
      return 'https://i.imgur.com/n5jBp45.gif';
    case '2':
      return 'https://i.imgur.com/XbH6gP4.gif';
    case '3':
      return 'https://i.imgur.com/g57i96f.gif';
    case '4':
      return 'https://i.imgur.com/MkUcTPl.gif';
    default:
      return 'https://i.imgur.com/n5jBp45.gif';
  }
};
