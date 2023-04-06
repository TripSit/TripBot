/* eslint-disable import/no-cycle */
import { RichReply } from 'matrix-bot-sdk';
import * as commands from './index';

export const name = 'help';
export const description = 'Overview of TripBot\'s commands.';
export const usage = '~help';

export default async function mHelp(roomId: string, event: any): Promise<boolean> {
  let html = '&#128218; <b>TripBot Commands:</b><br><br>';
  let text = 'TripBot Commands:\n\n';

  Object.values(commands).forEach(({ name, description, usage }) => {
    html += `• <b>${name}</b>:<br>${description}<br><code>${usage}</code><br><br>`;
    text += `${name}:\n${description}\nUsage:\n${usage}\n\n`;
  });

  await matrixClient.sendMessage(roomId, RichReply.createFor(roomId, event, text, html));
  return true;
}
