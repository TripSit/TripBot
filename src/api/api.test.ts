import type { Server } from 'node:http';

import supertest from 'supertest';

import api from './api';
import app from './app';

describe('API Server', () => {
  let server: Server;

  beforeAll(async () => {
    server = await api();
  });

  afterAll(() => {
    server.close();
  });

  it('should start and listen on the given port', async () => {
    const response = await supertest(app).get('/api');
    expect(response.statusCode).toBe(200);
  });

  // Add more tests as needed
});

describe('GET /api', () => {
  it('should respond with a message', async () => {
    const response = await supertest(app).get('/api').expect('Content-Type', /json/).expect(200);

    expect(response.body).toEqual({
      data: 'Want to change the data here? Check out the drug database repo at https://github.com/tripsit/drugs',
      description: 'You likely want one of the below endpoints.',
      developers:
        "Want type definitions? npm install tripsit/drugs and import { Drug, Interaction, Category } from 'tripsit_drug_db';",
      discord:
        'Want to discuss this API or other TripSit projects? Join the discord https://discord.gg/tripsit and check out the development rooms.',
      endpoints: {
        '/tripsit': {
          description: "TripSit's original API, preserved for legacy purposes.",
          endpoints: [
            '/getInteraction',
            '/getDrug',
            '/getAllDrugNames',
            '/getAllDrugNamesByCategory',
            '/getAllDrugs',
            '/getAllCategories',
            '/getAllDrugAliases',
          ],
        },
        '/v1': {
          description: 'Same as /tripsit, just renamed to v1 for consistency.',
          endpoints: [
            '/getInteraction',
            '/getDrug',
            '/getAllDrugNames',
            '/getAllDrugNamesByCategory',
            '/getAllDrugs',
            '/getAllCategories',
            '/getAllDrugAliases',
          ],
        },
        '/v2': {
          description: "TripSit's new API, under active development.",
          endpoints: [
            '/drugs',
            '/interactions',
            '/combinations',
            '/categories',
            '/aliases',
            '/search',
          ],
          warning: "This does not work, don't use it",
        },
      },
      github:
        'Want to help improve the API? Check out the code on the github: https://github.com/TripSit/TripBot/tree/main/src/api',
      welcome: "Welcome to TripSit's API endpoint.",
    });
  });
});
