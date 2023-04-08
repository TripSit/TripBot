/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { calcKetamine } from '../../global/commands/g.calcKetamine';

export default mCalcKet;

export const name = 'calc_ketamine';
export const description = 'Calculate your recommended ketamine dosage based on your weight';
export const usage = '~calc_ketamine [weight] [kg | lbs]';

const F = f(__filename);

async function mCalcKet(roomId:string, event:any, weight:string, unit:string):Promise<boolean> {
  if (unit !== 'kg' && unit !== 'lbs') { matrixClient.replyNotice(roomId, event, 'Usage: ~calc_ketamine <weight> <kg|lbs>'); return false; }
  if (unit === 'kg' && Number(weight) > 200) { matrixClient.replyNotice(roomId, event, 'Please enter a weight less than 200kg'); return false; }
  const ketaDosage = await calcKetamine(Number(weight), unit);
  const html = `<b>&#128067; Insufflated dosage:</b>:<br>${ketaDosage.insufflated}<br><br><b>&#127825; Rectal dosage:</b><br>${ketaDosage.rectal}<br><br><i>Please note that this information may not be 100% accurate. Do not use this as your only information source.</i>`;
  const text = `Insufflated dosage:\n${ketaDosage.insufflated}\n\nRectal dosage:\n${ketaDosage.rectal}\n\nPlease note that this information may not be 100% accurate. Do not use this as your only information source.`;
  const reply = RichReply.createFor(roomId, event, text, html);
  matrixClient.sendMessage(roomId, reply);
  return true;
}
