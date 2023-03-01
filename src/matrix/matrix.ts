import {
  MatrixClient,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
} from 'matrix-bot-sdk';
import * as commands from './commands';

export default startMatrix;

// using simple FS storage for now, as postgresql doesn't work in codespaces anyway
const storage = new SimpleFsStorageProvider('tempStorage.json');
// create the client and make it auto-join rooms on invite
const client:MatrixClient = new MatrixClient(env.MATRIX_HOMESERVER_URL, env.MATRIX_ACCESS_TOKEN, storage);
AutojoinRoomsMixin.setupOnClient(client);

/**
 * Handle incoming commands
 * @param roomId
 * @param event
 * @returns
 */
async function handleCommand(roomId: string, event: any) {
  // Don't handle unhelpful events (ones that aren't text messages, are redacted, or sent by us)
  if (event.content?.msgtype !== 'm.text') return;
  if (event.sender === await client.getUserId()) return;

  // ensure we're receiving a command
  if (event.content.body.startsWith('~') === false) return;
  const list = event.content.body.replace('~', ' ').split(' ');
  list.shift();
  const command = list[0];
  console.log(list);
  // look if the command exists
  if (command in commands === false) { await client.replyNotice(roomId, event, `${command} not found`); return; }

  try {
    // const args = list.shift();
    const resp = await (commands as any)[command].default();
    await client.replyNotice(roomId, event, resp);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Start the matrix bot
 */
async function startMatrix() {
// Before we start the bot, register our command handler
  client.on('room.message', handleCommand);
  // Now that everything is set up, start the bot. This will start the sync loop and run until killed.
  client.start().then(() => console.log('Bot started!'));
}
