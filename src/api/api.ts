/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import bodyParser from 'body-parser';
import { createRoom, inviteHelperteam } from '../matrix/utils/tripsitme';

const F = f(__filename);

const app = express();
app.use(bodyParser.json());

app.get('/status', (req, res) => {
  res.status(200).send({ error: false, status: 'OK', message: 'Up and running!' });
});

app.post('/api/createTicket', async (req, res) => {
  if (req.headers.secret !== env.TRIPBOT_API_SECRET) {
    res.status(401).send({ error: true, status: 'E_401', message: 'Request unauthorized' });
    return;
  }
  const { username, triage, intro } = req.body;
  if (!username || !triage || !intro) {
    res.status(400).send({
      error: true, status: 'E_400', message: 'Missing required parameters.', intro, triage, username,
    });
    return;
  }
  const roomId = await createRoom(null, username);
  await inviteHelperteam(roomId);
  res.status(200).send({ error: false, status: 'OK', data: { roomId } });
});

app.post('/api/updateTicket', async (req, res) => {

});

app.post('/api/closeTicket', async (req, res) => {

});
