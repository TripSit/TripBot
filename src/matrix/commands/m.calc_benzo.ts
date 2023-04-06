/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { calcBenzo } from '../../global/commands/g.calcBenzo';

export default mCalcBenzo;

export const name = 'calc_benzo';
export const description = 'Convert the given dose of a benzodiazepine to another benzodiazepine.';
export const usage = '~calc_benzo [dose_of_benzoA] [benzoA] [benzoB]';

const F = f(__filename);

async function mCalcBenzo(roomId:string, event:any, dose:string, benzoA:string, benzoB:string):Promise<boolean> {
  const doseB = await calcBenzo(Number(dose), benzoA, benzoB);
  const html = `<b>${dose} mg ${benzoA} equals ${doseB} mg ${benzoB}.</b><br><i>Please note that this information may not be 100% accurate. Do not use this as your only information source.</i>`;
  const text = `${dose} mg ${benzoA} equals ${doseB} mg ${benzoB}.\nPlease note that this information may not be 100% accurate. Do not use this as your only information source.`;
  const reply = RichReply.createFor(roomId, event, text, html);
  matrixClient.sendMessage(roomId, reply);
  return true;
}
