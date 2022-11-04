import log from '../global/utils/log';
import env from '../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

import Express from 'express';
import {URLSearchParams} from 'url';
import axios from 'axios';
// import path from 'path';
import https from 'https';
import http from 'http';
import fs from 'fs';
import bodyParser from 'body-parser';
// Import node-fetch asynchronously;
// see https://www.npmjs.com/package/node-fetch#installation for more info on why this is done.
// @ts-ignore
const fetch = (...args:any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 *
 * @param {string} authorizationToken
 * @return {any}
 */
function makeConfig(authorizationToken:string) {
  // https://circlertech.com/working-with-discord-oauth2
/* Make a function to give us configuration for the Discord API */
  const data = {
    headers: {
      authorization: `Bearer ${authorizationToken}`,
    },
  };
  return data; // Return the created object
}


/**
 *
 * @return {Promise<void>}
**/
export async function webserverConnect(): Promise<void> {
  /* Define app variables */
  // eslint-disable-next-line new-cap
  const app = Express(); // Create a web app

  const httpPort = 4030;
  const httpsPort = 8080;
  let host = 'discord.tripsit.me';
  // let host = 'tripsit-discord-bot-kf4yk.ondigitalocean.app';
  // const httpUrl = `http://${host}:${httpPort}/`;
  // let httpsUrl = `https://${host}:${httpsPort}/`;

  // If we're in development we need to create our own SSL certificate
  if (env.NODE_ENV === 'development') {
    host = 'localhost';
    // httpUrl = `http://${host}:${httpPort}/`;
    // httpsUrl = `https://${host}:${httpsPort}/`;

    const options = {
      key: fs.readFileSync('./cert/CA/localhost/client-1.local.key', 'utf8'),
      cert: fs.readFileSync('./cert/CA/localhost/client-1.local.crt', 'utf8'),
    };
    const httpsServer = https.createServer(options, app);
    const httpServer = http.createServer(app);

    httpsServer.listen(httpsPort);
    httpServer.listen(httpPort);
    log.info(`[${PREFIX}] Webserver running at: https://${host}:${httpsPort}/`);
    // httpsServer.listen(httpsPort, () => {
    //   log.info(`[${PREFIX}] HTTPS Server running at: ${httpsUrl}`);
    // });

    // httpServer.listen(httpPort, () => {
    //   log.info(`[${PREFIX}] HTTP Server running at: ${httpUrl}`);
    // });
  } else {
    app.listen(httpsPort);
    app.listen(httpPort);
    log.info(`[${PREFIX}] Webserver running at: https://${host}:${httpsPort}/`);
    // app.listen(httpsPort, () => {
    //   log.info(`[${PREFIX}] HTTPS Server running at: ${httpsUrl}`);
    // });

    // app.listen(httpPort, () => {
    //   log.info(`[${PREFIX}] HTTP Server running at: ${httpUrl}`);
    // });
  }

  /* Configure the app */
  app.use(Express.urlencoded({
    extended: false,
  })); // configure the app to parse requests with urlencoded payloads
  app.use(Express.json()); // configure the app to parse requests with JSON payloads
  app.use(bodyParser.text()); // configure the app to be able to read text
  app.use(Express.static(`${__dirname}\\`));
  // Production is linux so we need to use the forward slash
  app.use(Express.static(`${__dirname}/`));

  /* Handle GET Requests */
  app.get('/', (req, res) => { // Handle incoming GET requests to https://localhost:(port)/
    res.sendFile(path.join(`${__dirname}/pages/home.html`)); // Send the home.html file
  });

  /* Handle POST Requests */
  // Will run when there are any incoming POST requests to https://localhost:(port)/user.
  // Note that a POST request is different from a GET request
  // so this won't exactly work when you actually visit https://localhost:(port)/user
  app.post('/user', (req, res) => {
    const codeValue = req.body;
    const redirectUrl = `https://${host}/`;
    log.debug(`[${PREFIX}] codeValue: ${codeValue}`);
    log.debug(`[${PREFIX}] url: ${redirectUrl}`);

    /* Create our Form Data */
    const data1 = new URLSearchParams(); // Create a new formData object with the constructor
    data1.append('client_id', env.DISCORD_CLIENT_ID.toString()); // Append the client_id variable to the data
    data1.append('client_secret', env.DISCORD_CLIENT_SECRET); // Append the client_secret variable to the data
    data1.append('grant_type', 'authorization_code');
    // This field will tell the Discord API what you are wanting in your initial request.
    data1.append('redirect_uri', redirectUrl);
    // This is the redirect URL where the user will be redirected when they finish the Discord login
    data1.append('scope', 'identify');
    // This tells the Discord API what info you would like to retrieve.
    // You can change this to include guilds, connections, email, etc.
    data1.append('code', codeValue);
    // This is a key parameter in our upcoming request. It is the code the user got from logging in.
    // This will help us retrieve a token which we can use to get the user's info.

    fetch('https://discord.com/api/oauth2/token', {method: 'POST', body: data1}).then((response) =>
      response.json()).then((data:any) => {
      // Make a request to the Discord API with the form data, convert the response to JSON,
      // then take it and run the following code.
      log.debug(`[${PREFIX}] data: ${JSON.stringify(data)}`);
      axios.get('https://discord.com/api/users/@me', makeConfig(data.access_token)).then((response) => {
        // Make a request yet again to the Discord API with the token from previously.
        // log.debug(`[${PREFIX}] response: ${JSON.stringify(response)}`);
        res.status(200).send(response.data.username); // Send the username with a status code 200.
      }).catch((err:Error) => { // Handle any errors in the request (such as 401 errors).
        log.error(err); // Log the error in the console
        log.error(`[${PREFIX}] data: ${JSON.stringify(data)}`);
        res.sendStatus(500); // Send a 500 error.
      });
    });
  });
};
