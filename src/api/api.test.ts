/* eslint-disable max-len */
import supertest from 'supertest';
import { once } from 'node:events';
import { Server } from 'http';

import app from './app';
import api from './api';

describe('API Server', () => {
  let server: Server;

  beforeAll(async () => {
    vi.stubEnv('DNS_DOMAIN', 'example.test');
    try {
      server = await api();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  afterAll(() => {
    server.close();
  });

  it('should start and listen on the given port', async () => {
    const response = await supertest(server).get('/api');
    expect(response.statusCode).toBe(200);
  });
});

const IP_ENDPOINT = '/api/ip';
const FORWARDED_FOR = 'X-Forwarded-For';

describe('API middleware', () => {
  it('returns the requesting IP address', async () => {
    const ip = '192.0.2.10';
    await supertest(app).get(IP_ENDPOINT).set(FORWARDED_FOR, ip).expect(200, ip);
  });

  it('allows preflight requests from the TripSit website', async () => {
    const origin = 'https://tripsit.me';
    await supertest(app).options('/api/v2')
      .set('Origin', origin)
      .expect('Access-Control-Allow-Origin', origin)
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Allow-Methods', /GET/)
      .expect(200);
  });

  it('omits the allow-origin header for an unlisted origin', async () => {
    const response = await supertest(app).get('/api').set('Origin', 'https://example.test').expect(200);
    expect(response.headers).not.toHaveProperty('access-control-allow-origin');
  });

  it('returns 429 after the per-client request limit', async () => {
    const ip = '192.0.2.11';
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const client = supertest(server);
      await Promise.all(Array.from({ length: 120 }, () => client
        .get(IP_ENDPOINT).set(FORWARDED_FOR, ip).expect(200)));
      await client.get(IP_ENDPOINT).set(FORWARDED_FOR, ip)
        .expect(429, 'Too many requests, please try again later.');
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
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
