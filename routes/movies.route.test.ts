import * as supertest from 'supertest';
import * as express from 'express';

// @ts-expect-error - supertest exports function directly
const request = supertest as unknown as typeof supertest.default;

jest.mock('../controllers/movies.controller.ts', () => ({
  getAllMovies: jest.fn((req, res) => res.status(200).json([])),
  getPaginatedMovies: jest.fn((req, res) => res.status(200).json([])),
  getMovieById: jest.fn((req, res) => res.status(200).json({})),
  createMovie: jest.fn((req, res) => res.status(201).json({})),
  updateMovie: jest.fn((req, res) => res.status(200).json({})),
  deleteMovie: jest.fn((req, res) => res.status(204).send()),
}));

import moviesRouter from './movies.route.ts';
import * as MoviesController from '../controllers/movies.controller.ts';

const mockedMoviesController = MoviesController as jest.Mocked<typeof MoviesController>;

describe('Movies Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/movies', moviesRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /movies', () => {
    it('should call getAllMovies controller', async () => {
      mockedMoviesController.getAllMovies.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get('/movies');

      expect(mockedMoviesController.getAllMovies).toHaveBeenCalled();
    });
  });

  describe('GET /movies/paginated', () => {
    it('should call getPaginatedMovies controller', async () => {
      mockedMoviesController.getPaginatedMovies.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get('/movies/paginated?page=1&limit=10');

      expect(mockedMoviesController.getPaginatedMovies).toHaveBeenCalled();
    });
  });

  describe('GET /movies/:id', () => {
    it('should call getMovieById controller', async () => {
      mockedMoviesController.getMovieById.mockImplementation((req, res) => {
        res.status(200).json({ _id: '1', title: 'Test Movie' });
      });

      await request(app).get('/movies/1');

      expect(mockedMoviesController.getMovieById).toHaveBeenCalled();
    });
  });

  describe('POST /movies', () => {
    it('should call createMovie controller', async () => {
      mockedMoviesController.createMovie.mockImplementation((req, res) => {
        res.status(201).json({ _id: '1', title: 'New Movie' });
      });

      await request(app)
        .post('/movies')
        .send({ title: 'New Movie' });

      expect(mockedMoviesController.createMovie).toHaveBeenCalled();
    });
  });

  describe('PUT /movies/:id', () => {
    it('should call updateMovie controller', async () => {
      mockedMoviesController.updateMovie.mockImplementation((req, res) => {
        res.status(200).json({ _id: '1', title: 'Updated' });
      });

      await request(app)
        .put('/movies/1')
        .send({ title: 'Updated' });

      expect(mockedMoviesController.updateMovie).toHaveBeenCalled();
    });
  });

  describe('DELETE /movies/:id', () => {
    it('should call deleteMovie controller', async () => {
      mockedMoviesController.deleteMovie.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Deleted' });
      });

      await request(app).delete('/movies/1');

      expect(mockedMoviesController.deleteMovie).toHaveBeenCalled();
    });
  });
});
