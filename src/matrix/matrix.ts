import { existsSync } from 'fs';
import {
  MatrixClient,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
  requiresCrypto,
} from 'matrix-bot-sdk';

// using simple FS storage for now, as postgresql doesn't work in codespaces anyway
const storage = new SimpleFsStorageProvider('tempStorage.json');

// create the client and make it auto-join rooms on invite
const client = new MatrixClient(env.MATRIX_HOMESERVER_URL, env.MATRIX_ACCESS_TOKEN, storage);
AutojoinRoomsMixin.setupOnClient(client);

async function handleCommand(roomId: string, event: any) {
  // Don't handle unhelpful events (ones that aren't text messages, are redacted, or sent by us)
  if (event.content?.msgtype !== 'm.text') return;
  if (event.sender === await client.getUserId()) return;

  const { body } = event.content.toLowerCase().split('\\s+');

  // ensure we're receiving a command
  if (!body[0].startsWith('~')) return;
  const command = body[0].replace('~', '');
  // look if the file exists
  if (!existsSync(`commands/m.${command}.ts`)) return;

  try {
    // is that punk rock? or just bad code?
    require(`commands/m.${command}.ts`);

    const message = execute();
    await client.replyNotice(roomId, event, message);
  } catch (e) {
    console.log(e);
  }
}
