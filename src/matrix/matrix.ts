import {
  MatrixClient,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
} from 'matrix-bot-sdk';

import * as commands from './commands';

const F = f(__filename);
export default startMatrix;

// using simple FS storage for now, as postgresql doesn't work in codespaces anyway
const storage = new SimpleFsStorageProvider('cache/tripbot.json');

// create the client and make it auto-join rooms on invite
const client:MatrixClient = new MatrixClient(env.MATRIX_HOMESERVER_URL, env.MATRIX_ACCESS_TOKEN, storage);
AutojoinRoomsMixin.setupOnClient(client);

/**
 * Handle incoming commands
 * @param roomId
 * @param event
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCommand(roomId: string, event: any) {
  
  // Don't handle unhelpful events (ones that aren't text messages, are redacted, or sent by us)
  if (event.content?.msgtype !== 'm.text') return;
  if (event.sender === await client.getUserId()) return;

  // ensure we're receiving a command
  if (event.content.body.startsWith('~') === false) return;
  const list = event.content.body.replace('~', ' ').match(/(?:[^\s"]+|"[^"]*")+/g);
  const command = list[0];
  // look if the command exists
  if (command in commands === false) { await client.replyNotice(roomId, event, `${command} not found`); return; }

  try {
    // remove the 1st element of the list and only keep the args, also remove quotes
    list.shift();
    const args = list.map((arg:string) => arg.replace(/['"]+/g, ''));
    // inject required arguments
    args.unshift(roomId, event, client);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (commands as any)[command].default.apply(null, args); // run the command
    return;
    // await client.replyNotice(roomId, event, resp); // send the message in response to the user
  } catch (e) {
    log.error(F, e as string);
  }
}

/**
 * Start the matrix bot
 */
async function startMatrix() {
// Before we start the bot, register our command handler
  client.on('room.message', await handleCommand);

  // Now that everything is set up, start the bot. This will start the sync loop and run until killed.
  await client.start().then(async () => {
    log.info(F, 'Matrix-Bot started!');
    console.log(await client.getWhoAmI());
  });
}
