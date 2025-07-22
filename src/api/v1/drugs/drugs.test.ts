import supertest from 'supertest';

import app from '../../app';

const expectValue = 'Content-Type';

// describe('GET /api/v1/getInteraction', () => {
//   it('should respond with options that can be used', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getInteraction')
//       .expect(expectValue, /json/)
//       .expect(200);

//     expect(response.body)
//       .toEqual({ endpoint: 'getInteraction', properties: ['/drugAName', '/drugBName'], example: '/getInteraction/DXM/MDMA' });
//   });
// });

describe('GET /api/v1/getInteraction/:drugAName/:drugBName', () => {
  it('should respond with dxm + mdma combo info', async () => {
    const response = await supertest(app)
      .get('/api/v1/getInteraction/dxm/mdma')
      .expect(expectValue, /json/)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          color: 'Red',
          definition:
            'These combinations are considered extremely harmful and should always be avoided. Reactions to these drugs taken in combination are highly unpredictable and have a potential to cause death.',
          emoji: '☠️',
          interactionCategoryA: 'dxm',
          interactionCategoryB: 'mdma',
          result: 'Dangerous',
          thumbnail:
            'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/skull-and-crossbones_2620-fe0f.png',
        },
      ],
      err: null,
    });
  });
});

// describe('GET /api/v1/getDrug', () => {
//   it('should respond with options that can be used', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getDrug')
//       .expect(expectValue, /json/)
//       .expect(200);

//     expect(response.body)
//       .toEqual({ endpoint: 'getDrug', properties: ['/name'], example: '/getDrug/DXM' });
//   });
// });

// describe('GET /api/v1/getDrug/:name', () => {
//   it('should respond with data about that drug', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getDrug/dxm')
//       .expect(expectValue, /json/)
//       .expect(200);

//     // Check if the response has the correct structure
//     expect(response.body).toHaveProperty('err');
//     expect(response.body).toHaveProperty('data');
//     expect(Array.isArray(response.body.data)).toBeTruthy();

//     // Check if the data array is not empty and contains arrays
//     expect(response.body.data.length).toBeGreaterThan(0);

//     const drug = response.body.data[0];

//     expect(drug).toHaveProperty('name');
//   });
// });

// describe('GET /api/v1/getAllDrugNames', () => {
//   it('should respond with all drug names', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getAllDrugNames')
//       .expect(expectValue, /json/)
//       .expect(200);

//     // Check if the response has the correct structure
//     expect(response.body).toHaveProperty('err');
//     expect(response.body).toHaveProperty('data');
//     expect(Array.isArray(response.body.data)).toBeTruthy();

//     // Check if the data array is not empty and contains arrays
//     expect(response.body.data.length).toBeGreaterThan(0);
//     expect(Array.isArray(response.body.data[0])).toBeTruthy();

//     const aliases = response.body.data[0];

//     const expectedAliasCount = 550; // Update this number based on your expected count
//     expect(aliases.length).toBe(expectedAliasCount);
//   });
// });

// describe('GET /api/v1/getAllDrugNamesByCategory', () => {
//   it('should respond with options for this API point', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getAllDrugNamesByCategory')
//       .expect(expectValue, /json/)
//       .expect(200);

//     expect(response.body)
//       .toEqual({
//         endpoint: 'getAllDrugNamesByCategory',
//         properties: ['/category'],
//         example: '/getAllDrugNamesByCategory/stimulants',
//       });
//   });
// });

// describe('GET /api/v1/getAllDrugNamesByCategory/:category', () => {
//   const categories = {
//     barbiturate: 9,
//     benzodiazepine: 55,
//     common: 78,
//     deliriant: 9,
//     depressant: 176,
//     // dissociative: 33,
//     // empathogen: 54,
//     // 'habit-forming': 319,
//     // inactive: 10,
//     // nootropic: 28,
//     // opioid: 54,
//     // psychedelic: 152,
//     // 'research-chemical': 308,
//     // ssri: 6,
//     // stimulant: 166,
//     // supplement: 7,
//     // tentative: 236,
//   };

//   describe.each(Object.keys(categories))('%s', category => {
//     it('should respond with a list of drugs in that category', async () => {
//       const response = await supertest(app)
//         .get(`/api/v1/getAllDrugNamesByCategory/${category}`);
//         // .expect(expectValue, /json/)
//         // .expect(200);

//       console.log(response.error);
//       console.log(response.header['x-ratelimit-limit']);

//       expect(response.body.data[0].length).toEqual(categories[category as keyof typeof categories]);
//     }, 30000); // Timeout for each test
//   });
// });

// describe('GET /api/v1/getAllDrugs', () => {
//   it('should return a list of all drug info in the DB.', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getAllDrugs')
//       .expect(expectValue, /json/)
//       .expect(200);

//     // Check if the response has the correct structure
//     expect(response.body).toHaveProperty('err');
//     expect(response.body).toHaveProperty('data');
//     expect(Array.isArray(response.body.data)).toBeTruthy();

//     // Check if the data array is not empty
//     expect(response.body.data.length).toBeGreaterThan(0);

//     // Check the structure of the first drug object, if available
//     if (response.body.data.length > 0) {
//       const firstDrugKey = Object.keys(response.body.data[0])[0];
//       const firstDrug = response.body.data[0][firstDrugKey];

//       // Replace these checks with the actual structure you expect
//       expect(firstDrug).toHaveProperty('name');
//     }
//   });
// });

// describe('GET /api/v1/getAllCategories', () => {
//   it('should return a list of categories.', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getAllCategories')
//       .expect(expectValue, /json/)
//       .expect(200);

//     // Check if the response has the correct structure
//     expect(response.body).toHaveProperty('err');
//     expect(response.body).toHaveProperty('data');
//     expect(Array.isArray(response.body.data)).toBeTruthy();

//     // Check if the data array is not empty and contains arrays
//     expect(response.body.data.length).toBeGreaterThan(0);
//     expect(Array.isArray(response.body.data[0])).toBeTruthy();

//     // Check for the presence of specific categories
//     const categories = response.body.data[0];
//     expect(categories).toContain('barbiturate');
//     expect(categories).toContain('benzodiazepine');
//     expect(categories).toContain('common');
//     expect(categories).toContain('deliriant');
//     expect(categories).toContain('depressant');
//     expect(categories).toContain('dissociative');
//     expect(categories).toContain('empathogen');
//     expect(categories).toContain('habit-forming');
//     expect(categories).toContain('inactive');
//     expect(categories).toContain('nootropic');
//     expect(categories).toContain('opioid');
//     expect(categories).toContain('psychedelic');
//     expect(categories).toContain('research-chemical');
//     expect(categories).toContain('ssri');
//     expect(categories).toContain('stimulant');
//     expect(categories).toContain('supplement');
//     expect(categories).toContain('tentative');

//     // Optionally, check the total number of categories
//     const expectedCategoryCount = 17; // Update this number based on your expected count
//     expect(categories.length).toBe(expectedCategoryCount);
//   });
// });

// describe('GET /api/v1/getAllDrugAliases', () => {
//   it('should respond with a list of aliases.', async () => {
//     const response = await supertest(app)
//       .get('/api/v1/getAllDrugAliases')
//       .expect(expectValue, /json/)
//       .expect(200);

//     // Check if the response has the correct structure
//     expect(response.body).toHaveProperty('err');
//     expect(response.body).toHaveProperty('data');
//     expect(Array.isArray(response.body.data)).toBeTruthy();

//     // Check if the data array is not empty and contains arrays
//     expect(response.body.data.length).toBeGreaterThan(0);
//     expect(Array.isArray(response.body.data[0])).toBeTruthy();

//     const aliases = response.body.data[0];

//     const expectedAliasCount = 796; // Update this number based on your expected count
//     expect(aliases.length).toBe(expectedAliasCount);
//   });
// });
