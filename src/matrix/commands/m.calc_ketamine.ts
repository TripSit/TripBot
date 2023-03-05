/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { calcKetamine } from '../../global/commands/g.calcKetamine';

export default mCalcKet;

export const name = 'calc_ketamine';
export const description = 'Calculate your recommended ketamine dosage based on your weight';
export const usage = '~calc_ketamine <weight> <kg|lbs>';

const F = f(__filename);

async function mCalcKet(roomId:string, event:any, client:MatrixClient, weight:string, unit:string):Promise<boolean> {
  if (unit !== 'kg' && unit !== 'lbs') { client.replyNotice(roomId, event, 'Usage: ~calc_ketamine <weight> <kg|lbs>'); return false; }
  if (unit === 'kg' && Number(weight) > 200) { client.replyNotice(roomId, event, 'Please enter a weight less than 200kg'); return false; }
  const ketaDosage = await calcKetamine(Number(weight), unit);
  const html = `<b>&#128067; Insufflated dosage:</b>:<br>${ketaDosage.insufflated}<br><br><b>&#127825; Rectal dosage:</b><br>${ketaDosage.rectal}`;
  const text = `Insufflated dosage:\n${ketaDosage.insufflated}\n\nRectal dosage:\n${ketaDosage.rectal}`;
  const reply = RichReply.createFor(roomId, event, text, html);
  client.sendMessage(roomId, reply);
  return true;
}
