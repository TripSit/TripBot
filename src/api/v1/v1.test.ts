import supertest from 'supertest';

import app from '../app';

describe('GET /api/v1', () => {
  it('should respond with a message', async () => {
    const response = await supertest(app).get('/api/v1').expect('Content-Type', /json/).expect(200);

    expect(response.body).toEqual({
      publicEndpoints: [
        '/getInteraction',
        '/getDrug',
        '/getAllDrugNames',
        '/getAllDrugNamesByCategory',
        '/getAllDrugs',
        '/getAllCategories',
        '/getAllDrugAliases',
      ],
      welcome: "Welcome to TripSit's original API, preserved for legacy purposes.",
    });
  });
});
