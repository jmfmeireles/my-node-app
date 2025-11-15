import type { Request, Response, NextFunction } from 'express';
import * as AuthController from './auth.controller.ts';
import * as AuthService from '../services/auth.service.ts';

jest.mock('../services/auth.service.ts');

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      session: {} as any,
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and return 201', async () => {
      const userData = { username: 'testuser', password: 'password123' };
      const result = { message: 'User registered successfully', userId: 1 };
      
      mockReq.body = userData;
      mockedAuthService.registerUser.mockResolvedValue(result);

      await AuthController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAuthService.registerUser).toHaveBeenCalledWith(userData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Registration failed');
      mockedAuthService.registerUser.mockRejectedValue(error);

      await AuthController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user and regenerate session', async () => {
      const credentials = { username: 'testuser', password: 'password123' };
      const loginResult = { message: 'Login successful', username: 'testuser' };
      
      mockReq.body = credentials;
      mockReq.session = {
        regenerate: jest.fn((callback) => callback(null)),
      } as any;
      mockedAuthService.loginUser.mockResolvedValue(loginResult);

      await AuthController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAuthService.loginUser).toHaveBeenCalledWith(credentials);
      expect(mockReq.session.regenerate).toHaveBeenCalled();
      expect(mockReq.session.user).toBe('testuser');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Login successful' });
    });

    it('should call next with error if session regeneration fails', async () => {
      const credentials = { username: 'testuser', password: 'password123' };
      const loginResult = { message: 'Login successful', username: 'testuser' };
      const sessionError = new Error('Session error');
      
      mockReq.body = credentials;
      mockReq.session = {
        regenerate: jest.fn((callback) => callback(sessionError)),
      } as any;
      mockedAuthService.loginUser.mockResolvedValue(loginResult);

      await AuthController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(sessionError);
    });

    it('should call next with error on login failure', async () => {
      const error = new Error('Login failed');
      mockedAuthService.loginUser.mockRejectedValue(error);

      await AuthController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should call logoutUser service', () => {
      mockedAuthService.logoutUser.mockImplementation(() => {});

      AuthController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAuthService.logoutUser).toHaveBeenCalledWith(mockReq.session, mockRes, mockNext);
    });
  });

  describe('protectedRoute', () => {
    it('should return protected message with user', () => {
      mockReq.session = { user: 'testuser' } as any;

      AuthController.protectedRoute(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'You have accessed a protected route with user testuser',
      });
    });
  });

  describe('authenticateGoogle', () => {
    it('should redirect to Google auth URL and set state cookie', () => {
      const authUrl = { url: 'https://google.com/auth', state: 'random-state' };
      mockedAuthService.getGoogleAuthUrl.mockReturnValue(authUrl);

      AuthController.authenticateGoogle(mockReq as Request, mockRes as Response);

      expect(mockedAuthService.getGoogleAuthUrl).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith('state', 'random-state');
      expect(mockRes.redirect).toHaveBeenCalledWith('https://google.com/auth');
    });
  });

  describe('googleCallback', () => {
    it('should handle Google callback and return user info', async () => {
      const query = { code: 'auth-code', state: 'state-value' };
      const cookies = { state: 'state-value' };
      const result = { user: { name: 'Test User', email: 'test@example.com' } };
      
      mockReq.query = query;
      mockReq.cookies = cookies;
      mockReq.session = {} as any;
      mockedAuthService.handleGoogleCallback.mockResolvedValue(result);

      await AuthController.googleCallback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAuthService.handleGoogleCallback).toHaveBeenCalledWith(query, cookies, mockReq.session);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Callback failed');
      mockReq.query = { code: 'auth-code' };
      mockReq.cookies = {};
      mockedAuthService.handleGoogleCallback.mockRejectedValue(error);

      await AuthController.googleCallback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('protectedGoogle', () => {
    it('should return protected message when user is authenticated', () => {
      mockReq.session = { user: 'testuser' } as any;

      AuthController.protectedGoogle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'You have accessed a protected route with user testuser',
      });
    });

    it('should redirect to /authenticate when user is not authenticated', () => {
      mockReq.session = {} as any;

      AuthController.protectedGoogle(mockReq as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith('/authenticate');
    });
  });
});
