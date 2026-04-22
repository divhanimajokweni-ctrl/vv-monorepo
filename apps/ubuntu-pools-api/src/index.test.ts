import request from 'supertest';
import app from '../src/index';

describe('Health API', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.service).toBe('ubuntu-pools-api');
  });
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
    };

    const response = await request(app).post('/api/auth/register').send(userData).expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.tokens.accessToken).toBeDefined();
  });

  it('should login user', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens.accessToken).toBeDefined();
  });
});
