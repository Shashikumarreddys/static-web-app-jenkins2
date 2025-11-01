const request = require('supertest');
const app = require('../src');

describe('Secure Node.js Application', () => {
  
  test('GET /api/health should return status 200', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('Application is healthy');
  });

  test('GET /api/data should return application data', async () => {
    const response = await request(app).get('/api/data');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
  });

  test('POST /api/echo should echo the message', async () => {
    const response = await request(app)
      .post('/api/echo')
      .send({ message: 'Hello World' });
    expect(response.status).toBe(200);
    expect(response.body.received).toBe('Hello World');
  });

  test('POST /api/echo without message should return 400', async () => {
    const response = await request(app).post('/api/echo').send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
