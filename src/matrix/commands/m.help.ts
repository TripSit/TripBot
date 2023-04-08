/* eslint-disable import/no-cycle */
import { RichReply } from 'matrix-bot-sdk';
import * as commands from './index';

export const name = 'help';
export const description = 'Overview of TripBot\'s commands.';
export const usage = '~help';

export default async function mHelp(roomId: string, event: any): Promise<boolean> {
  let html = '&#128218; <b>TripBot Commands:</b><br><br>';
  let text = 'TripBot Commands:\n\n';

  Object.values(commands).forEach(command => {
    html += `• <b>${command.name}</b>:<br>${command.description}<br><code>${command.usage}</code><br><br>`;
    text += `${command.name}:\n${command.description}\nUsage:\n${command.usage}\n\n`;
  });

  await matrixClient.sendMessage(roomId, RichReply.createFor(roomId, event, text, html));
  return true;
}
