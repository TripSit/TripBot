/* eslint-disable max-len */
import supertest from 'supertest';
import { Server } from 'http';

import app from './app';
import api from './api';

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
    const response = await supertest(app)
      .get('/api')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body)
      .toEqual({
        welcome: 'Welcome to TripSit\'s API endpoint.',
        description: 'You likely want one of the below endpoints.',
        developers: 'Want type definitions? npm install tripsit/drugs and import { Drug, Interaction, Category } from \'tripsit_drug_db\';',
        data: 'Want to change the data here? Check out the drug database repo at https://github.com/tripsit/drugs',
        discord: 'Want to discuss this API or other TripSit projects? Join the discord https://discord.gg/tripsit and check out the development rooms.',
        github: 'Want to help improve the API? Check out the code on the github: https://github.com/TripSit/TripBot/tree/main/src/api',
        endpoints: {
          '/tripsit': {
            description: 'TripSit\'s original API, preserved for legacy purposes.',
            endpoints: {
              '/getAllDrugNames': {
                output: 'string[]',
              },
              '/getAllDrugNamesByCategory': {
                output: 'string[]',
              },
              '/getAllDrugs': {
                output: '{ [drugName: string]: Drug }, See github.com/tripsit/drugs for type info',
              },
              '/getAllCategories': {
                output: 'string[]',
              },
              '/getAllDrugAliases': {
                output: 'string[]',
              },
              '/getDrug': {
                input: {
                  drugName: 'string',
                },
                example: '/getDrug/DXM',
                output: {
                  success: 'Drug Object, see github./com/tripsit/drugs for type info',
                  error: {
                    err: 'boolean',
                    msg: 'string',
                    options: 'string[]',
                  },
                },
              },
              '/getInteraction': {
                input: {
                  drugA: 'string',
                  drugB: 'string',
                },
                example: '/getInteraction/DXM/MDMA',
                output: {
                  success: {
                    result: 'string',
                    interactionCategoryA: 'string',
                    interactionCategoryB: 'string',
                    definition: 'string?',
                    thumbnail: 'string?',
                    color: 'string?',
                    note: 'string?',
                    source: 'string?',
                  },
                  error: {
                    err: 'boolean',
                    msg: 'string',
                    options: 'string[]',
                  },
                },
              },
            },
          },
        },
      });
  });
});
