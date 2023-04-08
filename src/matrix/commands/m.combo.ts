/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import gCombo from '../../global/commands/g.combo';

export default mCombo;

export const name = 'combo';
export const description = 'Quickly look up a drug combination.';
export const usage = '~combo [drugA] [drugB]';

const F = f(__filename);

async function mCombo(roomId:string, event:any, drugA:string, drugB:string):Promise<boolean> {
  let text = '';
  let html = '';
  const comboResponse = await gCombo(drugA, drugB);
  if (comboResponse.success === false) {
    matrixClient.replyNotice(roomId, event, `Sorry, i couldn't fetch combo information for ${drugA} and ${drugB}.\nIf we have no information about a combo, that doesn't mean it's safe.\nPlease also double-check for typos or unknown aliases`);
  }
  html += `${comboResponse.title}<br>${comboResponse.description}`;
  text += `${comboResponse.title}<br>${comboResponse.description}`;

  const reply = RichReply.createFor(roomId, event, text, html);
  matrixClient.sendMessage(roomId, reply);

  return true;
}
