// Set test environment BEFORE anything else
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.SECRET_KEY = 'test-secret-key';
process.env.ATLAS_URI = 'mongodb://localhost:27017/test';
process.env.CLIENT_ID = 'test-client-id';
process.env.CLIENT_SECRET = 'test-client-secret';
process.env.REDIRECT_URI = 'http://localhost:3000/callback';

// Global timeout for all tests
jest.setTimeout(5000);
