/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { trimResultTransformer } from 'common-tags';
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { calcPsychedelics } from '../../global/commands/g.calcPsychedelics';

export default mCalcPsychedelics;

export const name = 'calc_psychedelics';
export const description = 'Tolerance calculator for LSD and Mushrooms.';
export const usage = '~calc_psychedelics [ LSD | Mushrooms ] [last dose (number)] [Days since last dose] [Desired dose]';

const F = f(__filename);

async function mCalcPsychedelics(roomId:string, event:any, substance:string = '', lastDose:string = '', days:string = '', desiredDose:string = ''):Promise<boolean> {
  // free params from all non-numeric characters and convert to numbers
  const cLDose = Number(lastDose.replace(/[^\d.-]/g, ''));
  const cDays = Number(days.replace(/[^\d.-]/g, ''));
  const cDDose = Number(desiredDose.replace(/[^\d.-]/g, ''));

  const neededDose = await calcPsychedelics(cLDose, cDays, cDDose);

  let text = '';
  let html = '';
  let reply;

  switch (substance.toLowerCase()) {
    case 'lsd' || 'acid':
      html = `&#127915;&#127889; <b>Result for LSD:</b> &#127915;&#127889;<br>When you had <b>${cLDose} μg</b> and want to feel the effects of </b>${cDDose} μg</b> ${cDays} days after that, you'd need to take <b>~${neededDose} μg</b> following our static calculation.<br>Please note, that this information might not be 100% accurate and should not be your only source of information.`;
      text = `When you had ${cLDose} μg and want to feel the effects of ${cDDose} μg ${cDays} days after that, you'd need to take ~${neededDose} μg following our static calculation.\nPlease note, that this information might not be 100% accurate and should not be your only source of information.`;
      reply = RichReply.createFor(roomId, event, text, html);
      matrixClient.sendMessage(roomId, reply);
      return true;
    case 'mushrooms':
      html = `&#127812 <b>Result for Mushrooms:</b> &#127812 <br>When you had <b>${cLDose} g</b> and want to feel the effects of <b>${cDDose} g</b> ${cDays} days after that, you'd need to take <b>~${neededDose} g</b> following our static calculation.<br>Please note, that this information might not be 100% accurate and should not be your only source of information.`;
      text = `When you had ${cLDose} g and want to feel the effects of ${cDDose} g< ${cDays} days after that, you'd need to take ~${neededDose} g following our static calculation.\nPlease note, that this information might not be 100% accurate and should not be your only source of information.`;
      reply = RichReply.createFor(roomId, event, text, html);
      matrixClient.sendMessage(roomId, reply);
      return true;
    default:
      html = '&#129302; Hey!<br>This is a tolerance calculator for LSD and Psilocybin mushrooms. It works like this:<br> <code>~calc_psychedelics lsd 100 5 75</code><br>Where the first argument (<code>lsd</code>) is the substance, the second one is the dose (<code>100</code> ug) that i took <code>5</code> days ago, and now i want to feel the effects of <code>75</code>ug and want to know how much i have to take for that, following TripBot\'s calculation.';
      text = 'Hey! This is a tolerance calculator for LSD and Psilocybin mushrooms.\nIt works like this:\n~calc_psychedelics lsd 100 5 75\nWhere the first argument can be "lsd" or "mushrooms", the second is the dose that you took, the third the days since you took them, and the last one your desired dose. TripBot will output you how much you\'d have to take, following its calculation, to feel the effects of your desired dose.';
      reply = RichReply.createFor(roomId, event, text, html);
      matrixClient.sendMessage(roomId, reply);
      return false;
  }
}
