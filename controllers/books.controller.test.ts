import type { Request, Response, NextFunction } from 'express';
import * as BooksController from './books.controller.ts';
import * as BookService from '../services/books.service.ts';

jest.mock('../services/books.service.ts');

const mockedBookService = BookService as jest.Mocked<typeof BookService>;

describe('Books Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createBook', () => {
    it('should create a book and return 201', async () => {
      const bookData = { title: 'Test Book', publicationYear: 2024, authorId: 1 };
      const createdBook = { id: 1, ...bookData };
      
      mockReq.body = bookData;
      mockedBookService.createBook.mockResolvedValue(createdBook as any);

      await BooksController.createBook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedBookService.createBook).toHaveBeenCalledWith(bookData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdBook);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Create failed');
      mockedBookService.createBook.mockRejectedValue(error);

      await BooksController.createBook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllBooks', () => {
    it('should return all books with 200', async () => {
      const books = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' },
      ];
      mockedBookService.fetchAllBooks.mockResolvedValue(books as any);

      await BooksController.getAllBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedBookService.fetchAllBooks).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(books);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Fetch failed');
      mockedBookService.fetchAllBooks.mockRejectedValue(error);

      await BooksController.getAllBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBookById', () => {
    it('should return book with 200 when found', async () => {
      const book = { id: 1, title: 'Test Book' };
      mockReq.params = { id: '1' };
      mockedBookService.fetchBookById.mockResolvedValue(book as any);

      await BooksController.getBookById(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockedBookService.fetchBookById).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(book);
    });

    it('should return 404 when book not found', async () => {
      mockReq.params = { id: '999' };
      mockedBookService.fetchBookById.mockResolvedValue(null);

      await BooksController.getBookById(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Book not found' });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Fetch failed');
      mockReq.params = { id: '1' };
      mockedBookService.fetchBookById.mockRejectedValue(error);

      await BooksController.getBookById(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBook', () => {
    it('should update book and return 200', async () => {
      const updateData = { title: 'Updated Book' };
      const updatedBook = { id: 1, ...updateData };
      mockReq.params = { id: '1' };
      mockReq.body = updateData;
      mockedBookService.updateBook.mockResolvedValue(updatedBook as any);

      await BooksController.updateBook(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockedBookService.updateBook).toHaveBeenCalledWith('1', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedBook);
    });

    it('should return 404 when book not found', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { title: 'Test' };
      mockedBookService.updateBook.mockResolvedValue(null);

      await BooksController.updateBook(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Book not found' });
    });
  });

  describe('deleteBook', () => {
    it('should delete book and return 200 with message', async () => {
      const message = 'Book deleted';
      mockReq.params = { id: '1' };
      mockedBookService.deleteBook.mockResolvedValue(message);

      await BooksController.deleteBook(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockedBookService.deleteBook).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message });
    });
  });

  describe('removeBookFromShelf', () => {
    it('should remove book from shelf and return 200', async () => {
      const message = 'Book removed from shelf';
      mockReq.params = { bookId: '1', shelfId: '2' };
      mockedBookService.removeBookFromShelf.mockResolvedValue(message);

      await BooksController.removeBookFromShelf(mockReq as Request<{ bookId: string; shelfId: string }>, mockRes as Response, mockNext);

      expect(mockedBookService.removeBookFromShelf).toHaveBeenCalledWith('1', '2');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message });
    });
  });

  describe('getBookShelves', () => {
    it('should return book shelves with 200', async () => {
      const shelves = [{ id: 1, name: 'Fiction' }];
      mockReq.params = { id: '1' };
      mockedBookService.fetchBookShelves.mockResolvedValue(shelves as any);

      await BooksController.getBookShelves(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockedBookService.fetchBookShelves).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(shelves);
    });

    it('should return 404 when book not found', async () => {
      mockReq.params = { id: '999' };
      mockedBookService.fetchBookShelves.mockResolvedValue(null);

      await BooksController.getBookShelves(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Book not found' });
    });
  });

  describe('getShelvesWithBooks', () => {
    it('should return shelves with books and 200', async () => {
      const shelves = [
        { id: 1, name: 'Fiction', books: [] },
        { id: 2, name: 'Non-fiction', books: [] },
      ];
      mockedBookService.fetchShelvesWithBooks.mockResolvedValue(shelves as any);

      await BooksController.getShelvesWithBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedBookService.fetchShelvesWithBooks).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(shelves);
    });
  });
});
