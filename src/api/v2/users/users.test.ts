import supertest from 'supertest';

import app from '../../app';

const expectValue = 'Content-Type';

describe('GET /api/v2/drugs', () => {
  it('should respond with an array of drugs', async () => {
    const response = await supertest(app)
      .get('/api/v2/drugs')
      .expect(expectValue, /json/)
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should respond with a single drug', async () => {
    const response = await supertest(app)
      .get('/api/v2/drugs/dxm')
      .expect(expectValue, /json/)
      .expect(200);

    expect(response.body.name).toBe('DXM');
  });

  it('should respond with a 404 for a not found drug', async () => {
    await supertest(app)
      .get('/api/v2/drugs/4200')
      .expect(expectValue, /json/)
      .expect(404);
  });

  it('should respond with a 404 for a not found drug', async () => {
    await supertest(app)
      .get('/api/v2/drugs/error')
      .expect(expectValue, /json/)
      .expect(500);
  });
});
