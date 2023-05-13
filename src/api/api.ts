import Express, { Request, Response } from 'express';
import https from 'https';
import cors from 'cors';
import fs from 'fs';
import bodyParser from 'body-parser';
import appeal from './modules/appeal';

const F = f(__filename);

async function checkAuth(
  req: Request,
  res: Response,
):Promise<boolean> {
  log.debug(F, 'Checking auth');
  // Check the authorization header
  const authHeader = req.headers.authorization;
  log.debug(F, `${JSON.stringify(authHeader, null, 2)}`);
  if (!authHeader) {
    log.error(F, 'No authorization header');
    res.status(401).send('No authorization header');
    return false;
  }

  // Check the authorization header is in the correct format
  const authHeaderParts = authHeader.split(' ');
  if (authHeaderParts.length !== 2) {
    log.error(F, 'Authorization header is not in the correct format');
    res.status(401).send('Authorization header is not in the correct format');
    return false;
  }

  // Check the authorization header is a basic token
  const authHeaderType = authHeaderParts[0];
  if (authHeaderType !== 'Basic') {
    log.error(F, 'Authorization header is not a basic token');
    res.status(401).send('Authorization header is not a basic token');
    return false;
  }

  // Check the authorization header has a token
  const authToken = authHeaderParts[1];
  if (!authToken) {
    log.error(F, 'Authorization header does not have a token');
    res.status(401).send('Authorization header does not have a token');
    return false;
  }

  // Check the authorization token is valid
  const myToken = Buffer.from(`${env.VUE_APP_USERNAME}:${env.VUE_APP_PASSWORD}`).toString('base64');

  if (authToken === myToken) {
    log.error(F, 'Authorization token is not valid');
    log.error(F, `authToken: ${authToken}`);
    log.error(F, `myToken: ${myToken}`);
    log.error(F, `env.API_USERNAME: ${env.VUE_APP_USERNAME}`);
    log.error(F, `env.API_PASSWORD: ${env.VUE_APP_PASSWORD}`);
    res.status(401).send('Authorization token is not valid');
    return false;
  }
  return true;
}

export async function webserverConnect(): Promise<void> {
  const app = Express(); // Create a web app

  // const httpPort = 1337;
  const httpsPort = 1887;
  const host = env.NODE_ENV === 'production' ? 'tb-api.tripsit.me' : 'localhost';
  // const httpUrl = `http://${host}:${httpPort}/`;
  const httpsUrl = `https://${host}:${httpsPort}/`;

  // If we're in development we need to create our own SSL certificate
  if (env.NODE_ENV === 'development') {
    const options = {
      key: fs.readFileSync('./cert/CA/localhost/client-1.local.key', 'utf8'),
      cert: fs.readFileSync('./cert/CA/localhost/client-1.local.crt', 'utf8'),
    };
    const httpsServer = https.createServer(options, app);
    // const httpServer = http.createServer(app);

    httpsServer.listen(httpsPort, () => {
      log.info(F, `HTTPS Server running at: ${httpsUrl}`);
    });

    // httpServer.listen(httpPort, () => {
    //   log.info(F, `HTTP Server running at: ${httpUrl}`);
    // });
  } else {
    app.listen(httpsPort, () => {
      log.info(F, `HTTPS Server running at: ${httpsUrl}`);
    });

    // app.listen(httpPort, () => {
    //   log.info(F, `HTTP Server running at: ${httpUrl}`);
    // });
  }

  /* Configure the app */
  app.use(Express.urlencoded({ extended: false })); // configure the app to parse requests with urlencoded payloads
  app.use(Express.json()); // configure the app to parse requests with JSON payloads
  app.use(bodyParser.text()); // configure the app to be able to read text
  app.use(bodyParser.json()); // configure the app to be able to read json
  // app.use(Express.static(`${__dirname}\\`));
  // app.use(Express.static(`${__dirname}/`)); // Production is linux so we need to use the forward slash

  // Allow all cross-origin requests
  app.use(cors());

  // Allow only specific origins
  // app.use(cors({
  //   origin: 'https://localhost:8080',
  //   methods: ['GET', 'POST'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // }));

  /* Handle GET Requests */
  app.get('/', (req, res) => {
    res.send('pong').status(200);
  });

  /* Handle POST Requests */
  app.post('/appeal', async (req, res) => {
    if (await checkAuth(req, res)) {
      await appeal(req, res);
    }
  });
}

export default webserverConnect;
