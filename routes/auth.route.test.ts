import * as supertest from 'supertest';
import * as express from 'express';

// @ts-ignore - supertest exports function directly
const request = supertest as unknown as typeof supertest.default;

jest.mock('../middlewares/session.middleware.ts', () => ({
  authenticationSession: jest.fn((req, res, next) => next()),
}));

jest.mock('../controllers/auth.controller.ts', () => ({
  register: jest.fn((req, res) => res.status(201).json({})),
  login: jest.fn((req, res) => res.status(200).json({})),
  logout: jest.fn((req, res) => res.status(200).json({})),
  protectedRoute: jest.fn((req, res) => res.status(200).json({})),
  authenticateGoogle: jest.fn((req, res) => res.redirect('/auth/google/callback')),
  googleCallback: jest.fn((req, res) => res.redirect('/')),
  protectedGoogle: jest.fn((req, res) => res.status(200).json({})),
}));

import authRouter from './auth.route.ts';
import * as AuthController from '../controllers/auth.controller.ts';

const mockedAuthController = AuthController as jest.Mocked<typeof AuthController>;

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should call register controller', async () => {
      mockedAuthController.register.mockImplementation((req, res) => {
        res.status(201).json({ message: 'User registered' });
      });

      await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(mockedAuthController.register).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should call login controller', async () => {
      mockedAuthController.login.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Login successful' });
      });

      await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(mockedAuthController.login).toHaveBeenCalled();
    });
  });

  describe('POST /auth/logout', () => {
    it('should call logout controller', async () => {
      mockedAuthController.logout.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Logout successful' });
      });

      await request(app).post('/auth/logout');

      expect(mockedAuthController.logout).toHaveBeenCalled();
    });
  });

  describe('GET /auth/protected', () => {
    it.skip('should call protectedRoute controller with middleware', async () => {
      const response = await request(app).get('/auth/protected');

      expect(response.status).toBe(200);
      expect(mockedAuthController.protectedRoute).toHaveBeenCalled();
    });
  });

  describe('GET /auth/authenticate', () => {
    it('should call authenticateGoogle controller', async () => {
      mockedAuthController.authenticateGoogle.mockImplementation((req, res) => {
        res.redirect('https://google.com/auth');
      });

      await request(app).get('/auth/authenticate');

      expect(mockedAuthController.authenticateGoogle).toHaveBeenCalled();
    });
  });

  describe('GET /auth/callback', () => {
    it('should call googleCallback controller', async () => {
      mockedAuthController.googleCallback.mockImplementation((req, res) => {
        res.status(200).json({ user: { name: 'Test' } });
      });

      await request(app).get('/auth/callback?code=123&state=abc');

      expect(mockedAuthController.googleCallback).toHaveBeenCalled();
    });
  });

  describe('GET /auth/protected-google', () => {
    it.skip('should call protectedGoogle controller with middleware', async () => {
      const response = await request(app).get('/auth/protected-google');

      expect(response.status).toBe(200);
      expect(mockedAuthController.protectedGoogle).toHaveBeenCalled();
    });
  });
});
