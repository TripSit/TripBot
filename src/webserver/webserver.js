'use strict';

/* Import dependencies */
const Express = require('express'); // Import express
const { URLSearchParams } = require('url'); // import URLSearchParams from url. You can also use form-data (const FormData = require('form-data');).
const axios = require('axios'); // Import Axios
const path = require('path'); // Import path
const https = require('https');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const PREFIX = require('path').parse(__filename).name;
// Import body-parser
// eslint-disable-next-line no-shadow
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // Import node-fetch asynchronously; see https://www.npmjs.com/package/node-fetch#installation for more info on why this is done.

// https://circlertech.com/working-with-discord-oauth2

/* Client Variables */
const {
  NODE_ENV,
  discordClientId,
  discordClientSecret,
} = require('../../env');
const logger = require('../utils/logger');

/* Make a function to give us configuration for the Discord API */
function makeConfig(authorizationToken) { // Define the function
  const data = { // Define "data"
    headers: { // Define "headers" of "data"
      authorization: `Bearer ${authorizationToken}`, // Define the authorization
    },
  };
  return data; // Return the created object
}

module.exports = {
  async webserver() {
    /* Define app variables */
    const app = Express(); // Create a web app

    const httpPort = 80;
    const httpsPort = 8080;
    // let host = 'discord.tripsit.me';
    let host = 'tripsit-discord-bot-kf4yk.ondigitalocean.app';
    let httpUrl = `http://${host}:${httpPort}/`;
    let httpsUrl = `https://${host}:${httpsPort}/`;

    // If we're in development we need to create our own SSL certificate
    if (NODE_ENV === 'development') {
      host = 'localhost';
      httpUrl = `http://${host}:${httpPort}/`;
      httpsUrl = `https://${host}:${httpsPort}/`;

      const options = {
        key: fs.readFileSync('./cert/CA/localhost/client-1.local.key', 'utf8'),
        cert: fs.readFileSync('./cert/CA/localhost/client-1.local.crt', 'utf8'),
      };
      const httpsServer = https.createServer(options, app);
      const httpServer = http.createServer(app);

      httpsServer.listen(httpsPort, () => {
        logger.debug(`[${PREFIX}] HTTPS Server running at: ${httpsUrl}`);
      });

      httpServer.listen(httpPort, () => {
        logger.debug(`[${PREFIX}] HTTP Server running at: ${httpUrl}`);
      });
    } else {
      app.listen(httpsPort, () => {
        logger.debug(`[${PREFIX}] HTTPS Server running at: ${httpsUrl}`);
      });

      app.listen(httpPort, () => {
        logger.debug(`[${PREFIX}] HTTP Server running at: ${httpUrl}`);
      });
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
    app.post('/user', (req, res) => { // Will run when there are any incoming POST requests to https://localhost:(port)/user. Note that a POST request is different from a GET request, so this won't exactly work when you actually visit https://localhost:(port)/user
      const codeValue = req.body;
      logger.debug(`[${PREFIX}] discordClientId: ${discordClientId}`);
      logger.debug(`[${PREFIX}] discordClientSecret: ${discordClientSecret}`);
      logger.debug(`[${PREFIX}] codeValue: ${codeValue}`);
      logger.debug(`[${PREFIX}] url: ${httpsUrl}`);
      /* Create our Form Data */
      const data1 = new URLSearchParams(); // Create a new formData object with the constructor
      data1.append('client_id', discordClientId); // Append the client_id variable to the data
      data1.append('client_secret', discordClientSecret); // Append the client_secret variable to the data
      data1.append('grant_type', 'authorization_code'); // This field will tell the Discord API what you are wanting in your initial request.
      data1.append('redirect_uri', httpsUrl); // This is the redirect URL where the user will be redirected when they finish the Discord login
      data1.append('scope', 'identify'); // This tells the Discord API what info you would like to retrieve. You can change this to include guilds, connections, email, etc.
      data1.append('code', codeValue); // This is a key parameter in our upcoming request. It is the code the user got from logging in. This will help us retrieve a token which we can use to get the user's info.

      fetch('https://discord.com/api/oauth2/token', { method: 'POST', body: data1 }).then(response => response.json()).then(data => { // Make a request to the Discord API with the form data, convert the response to JSON, then take it and run the following code.
        logger.debug(`[${PREFIX}] data: ${JSON.stringify(data)}`);
        axios.get('https://discord.com/api/users/@me', makeConfig(data.access_token)).then(response => { // Make a request yet again to the Discord API with the token from previously.
          // logger.debug(`[${PREFIX}] response: ${JSON.stringify(response)}`);
          res.status(200).send(response.data.username); // Send the username with a status code 200.
        }).catch(err => { // Handle any errors in the request (such as 401 errors).
          logger.error(err); // Log the error in the console
          logger.error(`[${PREFIX}] data: ${JSON.stringify(data)}`);
          res.sendStatus(500); // Send a 500 error.
        });
      });
    });
  },
};
