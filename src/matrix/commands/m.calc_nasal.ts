/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { calcSolvent, calcSubstance } from '../../global/commands/g.calcNasal';

export default mCalcNasal;

/**
 * --- TODO ----
 * I think usability of this command can be heavily improved.
 */

export const name = 'calc_nasal';
export const description = 'Calculate how much of a solvent to use for a given amount of a substance or how much of a substance to use for a given amount of solvent when mixing drugs into nose spray';
export const usage = 'To calculate how much of the substance you need:\n ~calc_nasal substance [Amount of solvent in ml] [how much mg you want to excreed per push] [how much ml the spray excreeds per push¹]\n\nTo calculate how much of the solvent you need: ~calc_nasal solvent [amount of substance in mg], [wanted mg of substance per push], [excreted ml per push¹]\n\n¹: You typically find this information on the packaging of the nose spray';

const F = f(__filename);

async function mCalcNasal(roomId:string, event:any, func:string = '', x:string = '', mgpp:string = '', mlpp:string = ''):Promise<boolean> {
  const cMlpp = Number(mlpp.replace(/[^\d.-]/g, ''));
  const cMgpp = Number(mgpp.replace(/[^\d.-]/g, ''));
  const cSubstanceOrSolvent = Number(x.replace(/[^\d.-]/g, ''));
  if ((func.toLowerCase() === 'substance' || 'solvent') && cMlpp !== null && cMgpp !== null) {
    if (func.toLowerCase() === 'substance') {
      const result = await calcSubstance(cSubstanceOrSolvent, cMgpp, cMlpp);
      const text = `To excreed ${cMgpp} mg of whatever substance you want to use with your nasal spray that excreeds ${cMlpp} ml of mixture per push, you'll need to add ${result} mg of that substance to the ${cSubstanceOrSolvent} ml solvent.\n\nPlease note that this information may not be 100% accurate. Do not use this as your only information source.`;
      const html = `To excreed <b>${cMgpp} mg</b> of whatever substance you want to use with your nasal spray that excreeds <b>${cMlpp} ml</b> of mixture per push, you'll need to add <b>${result} mg</b> of that substance to the <b>${cSubstanceOrSolvent} ml</b> solvent.<br><br><i>Please note that this information may not be 100% accurate. Do not use this as your only information source.</i>`;
      const reply = RichReply.createFor(roomId, event, text, html);
      matrixClient.sendMessage(roomId, reply);
      return true;
    }
    if (func.toLowerCase() === 'solvent') {
      const result = await calcSolvent(cSubstanceOrSolvent, cMgpp, cMlpp);
      const text = `To excreed ${cMgpp} mg per push from the ${cSubstanceOrSolvent} mg of your substance of choice, add ${result} ml of water or your solvent of choice.\n\nPlease note that this information may not be 100% accurate. Do not use this as your only information source.`;
      const html = `To excreed <b>${cMgpp} mg</b> per push from the <b>${cSubstanceOrSolvent} mg</b> of your substance of choice, add <b>${result} ml</b> of water or your solvent of choice.<br><br><i>Please note that this information may not be 100% accurate. Do not use this as your only information source.</i>`;
      const reply = RichReply.createFor(roomId, event, text, html);
      matrixClient.sendMessage(roomId, reply);
      return true;
    }
  } else {
    matrixClient.replyNotice(roomId, event, `This is a calculator for mixing drugs with nasal spray. You can calculete  how much of a solvent to use for a given amount of a substance or how much of a substance to use for a given amount of solvent. It works like this:\n\n${usage}`);
    return false;
  }
  return false;
}
