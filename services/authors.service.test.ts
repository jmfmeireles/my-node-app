import * as AuthorsService from './authors.service.ts';

// Mock all dependencies before importing them
jest.mock('../config/db.ts', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock('../models/author.model.ts', () => ({
  Author: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('../models/book.model.ts', () => ({
  Book: jest.fn(),
}));

jest.mock('../models/profile.model.ts', () => ({
  Profile: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

import sequelize from '../config/db.ts';
import { Author } from '../models/author.model.ts';
import { Book } from '../models/book.model.ts';
import { Profile } from '../models/profile.model.ts';

const mockedSequelize = sequelize as jest.Mocked<typeof sequelize>;
const mockedAuthor = Author as jest.Mocked<typeof Author>;
const mockedBook = Book as jest.Mocked<typeof Book>;
const mockedProfile = Profile as jest.Mocked<typeof Profile>;

describe('Authors Service', () => {
  let mockTransaction: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    mockedSequelize.transaction.mockResolvedValue(mockTransaction as never);
  });

  describe('createAuthor', () => {
    it('should create an author without biography', async () => {
      const authorData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1980-01-01'),
      };
      const mockAuthor = { id: 1, ...authorData, toJSON: jest.fn().mockReturnValue({ id: 1, ...authorData }) };

      mockedAuthor.create.mockResolvedValue(mockAuthor as never);

      const result = await AuthorsService.createAuthor(authorData);

      expect(result).toEqual({ id: 1, ...authorData, profile: null });
      expect(mockedProfile.create).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should create an author with biography', async () => {
      const authorData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        dateOfBirth: new Date('1985-05-15'),
        biography: 'An amazing author',
      };
      const mockAuthor = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        dateOfBirth: new Date('1985-05-15'),
        toJSON: jest.fn().mockReturnValue({
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          dateOfBirth: new Date('1985-05-15'),
        }),
      };
      const mockProfile = { biography: 'An amazing author', authorId: 2, toJSON: jest.fn().mockReturnValue({ biography: 'An amazing author', authorId: 2 }) };

      mockedAuthor.create.mockResolvedValue(mockAuthor as never);
      mockedProfile.create.mockResolvedValue(mockProfile as never);

      const result = await AuthorsService.createAuthor(authorData);

      expect(mockedProfile.create).toHaveBeenCalledWith(
        { biography: 'An amazing author', authorId: 2 },
        { transaction: mockTransaction }
      );
      expect(result.profile).toEqual({ biography: 'An amazing author', authorId: 2 });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const authorData = {
        firstName: 'Error',
        lastName: 'Test',
        email: 'error@example.com',
        dateOfBirth: new Date('1990-01-01'),
      };

      mockedAuthor.create.mockRejectedValue(new Error('Database error'));

      await expect(AuthorsService.createAuthor(authorData)).rejects.toThrow('Database error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('fetchAllAuthors', () => {
    it('should return all authors', async () => {
      const mockAuthors = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ];
      mockedAuthor.findAll.mockResolvedValue(mockAuthors as never);

      const result = await AuthorsService.fetchAllAuthors();

      expect(result).toEqual(mockAuthors);
      expect(mockedAuthor.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('fetchAuthorById', () => {
    it('should return an author with books and profile', async () => {
      const mockAuthor = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        books: [{ title: 'Book 1' }],
      };
      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);

      const result = await AuthorsService.fetchAuthorById('1');

      expect(result).toEqual(mockAuthor);
      expect(mockedAuthor.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Book, as: 'books' }),
          expect.objectContaining({ model: Profile, as: 'profile' }),
        ]),
      }));
    });
  });

  describe('updateAuthor', () => {
    it('should return null if author not found', async () => {
      mockedAuthor.findByPk.mockResolvedValue(null);

      const result = await AuthorsService.updateAuthor('1', {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        dateOfBirth: new Date('1980-01-01'),
      });

      expect(result).toBeNull();
    });

    it('should update author without biography', async () => {
      const mockAuthor = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        update: jest.fn(),
      };

      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        dateOfBirth: new Date('1980-01-01'),
      };

      await AuthorsService.updateAuthor('1', updateData);

      expect(mockAuthor.update).toHaveBeenCalledWith(updateData, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should update author with biography', async () => {
      const mockAuthor = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        update: jest.fn(),
      };
      const mockProfile = { biography: 'Old bio', update: jest.fn() };

      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);
      mockedProfile.findOne.mockResolvedValue(mockProfile as never);

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        dateOfBirth: new Date('1980-01-01'),
        biography: 'New bio',
      };

      await AuthorsService.updateAuthor('1', updateData);

      expect(mockProfile.update).toHaveBeenCalledWith({ biography: 'New bio' }, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('deleteAuthor', () => {
    it('should return null if author not found', async () => {
      mockedAuthor.findByPk.mockResolvedValue(null);

      const result = await AuthorsService.deleteAuthor('1');

      expect(result).toBeNull();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should delete author and related books', async () => {
      const mockBook1 = { id: 1, destroy: jest.fn() };
      const mockBook2 = { id: 2, destroy: jest.fn() };
      const mockAuthor = {
        id: 1,
        firstName: 'John',
        destroy: jest.fn(),
        books: [mockBook1, mockBook2],
      };

      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);

      const result = await AuthorsService.deleteAuthor('1');

      expect(result).toBe('Author and related books deleted successfully');
      expect(mockAuthor.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockBook1.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockBook2.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('restoreAuthor', () => {
    it('should return null if author not found', async () => {
      mockedAuthor.findByPk.mockResolvedValue(null);

      const result = await AuthorsService.restoreAuthor('1');

      expect(result).toBeNull();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should restore author and related books', async () => {
      const mockBook1 = { id: 1, restore: jest.fn() };
      const mockBook2 = { id: 2, restore: jest.fn() };
      const mockAuthor = {
        id: 1,
        firstName: 'John',
        restore: jest.fn(),
        books: [mockBook1, mockBook2],
      };

      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);

      const result = await AuthorsService.restoreAuthor('1');

      expect(result).toBe('Author and related books restored successfully');
      expect(mockAuthor.restore).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockBook1.restore).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockBook2.restore).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });
});
