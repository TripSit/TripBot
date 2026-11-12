import supertest from 'supertest';

import app from '../app';

describe('GET /v2', () => {
  it('should respond with a message', async () => {
    const response = await supertest(app)
      .get('/api/v2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      welcome: 'Welcome to TripSit\'s new API',
      publicEndpoints: ['/drugs'],
      privateEndpoints: ['/users', '/appeals', '/bounty', '/keycloak', '/pr'],
    });
  });
});
