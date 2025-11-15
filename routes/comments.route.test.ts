import * as supertest from 'supertest';
import * as express from 'express';

// @ts-expect-error - supertest exports function directly
const request = supertest as unknown as typeof supertest.default;

jest.mock('../controllers/comments.controller.ts', () => ({
  getAllComments: jest.fn((req, res) => res.status(200).json([])),
  getPaginatedComments: jest.fn((req, res) => res.status(200).json([])),
  getCommentById: jest.fn((req, res) => res.status(200).json({})),
  createComment: jest.fn((req, res) => res.status(201).json({})),
  updateComment: jest.fn((req, res) => res.status(200).json({})),
  deleteComment: jest.fn((req, res) => res.status(204).send()),
}));

import commentsRouter from './comments.route.ts';
import * as CommentsController from '../controllers/comments.controller.ts';

const mockedCommentsController = CommentsController as jest.Mocked<typeof CommentsController>;

describe('Comments Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/comments', commentsRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /comments', () => {
    it('should call getAllComments controller', async () => {
      mockedCommentsController.getAllComments.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get('/comments');

      expect(mockedCommentsController.getAllComments).toHaveBeenCalled();
    });
  });

  describe('GET /comments/paginated', () => {
    it('should call getPaginatedComments controller', async () => {
      mockedCommentsController.getPaginatedComments.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get('/comments/paginated?page=1&limit=10');

      expect(mockedCommentsController.getPaginatedComments).toHaveBeenCalled();
    });
  });

  describe('GET /comments/:id', () => {
    it('should call getCommentById controller', async () => {
      mockedCommentsController.getCommentById.mockImplementation((req, res) => {
        res.status(200).json({ _id: '1', text: 'Test Comment' });
      });

      await request(app).get('/comments/1');

      expect(mockedCommentsController.getCommentById).toHaveBeenCalled();
    });
  });

  describe('POST /comments', () => {
    it('should call createComment controller', async () => {
      mockedCommentsController.createComment.mockImplementation((req, res) => {
        res.status(201).json({ _id: '1', text: 'New Comment' });
      });

      await request(app)
        .post('/comments')
        .send({ text: 'New Comment' });

      expect(mockedCommentsController.createComment).toHaveBeenCalled();
    });
  });

  describe('PUT /comments/:id', () => {
    it('should call updateComment controller', async () => {
      mockedCommentsController.updateComment.mockImplementation((req, res) => {
        res.status(200).json({ _id: '1', text: 'Updated' });
      });

      await request(app)
        .put('/comments/1')
        .send({ text: 'Updated' });

      expect(mockedCommentsController.updateComment).toHaveBeenCalled();
    });
  });

  describe('DELETE /comments/:id', () => {
    it('should call deleteComment controller', async () => {
      mockedCommentsController.deleteComment.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Deleted' });
      });

      await request(app).delete('/comments/1');

      expect(mockedCommentsController.deleteComment).toHaveBeenCalled();
    });
  });
});
