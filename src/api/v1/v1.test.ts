import supertest from 'supertest';

import app from '../app';

describe('GET /api/v1', () => {
  it('should respond with a message', async () => {
    const response = await supertest(app)
      .get('/api/v1')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body)
      .toEqual({
        welcome: 'Welcome to TripSit\'s original API, preserved for legacy purposes.',
        publicEndpoints: {
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
      });
  });
});
