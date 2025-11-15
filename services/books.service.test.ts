import * as BookService from "./books.service.ts";

// Mock all dependencies before importing them
jest.mock("../config/db.ts", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock("../models/author.model.ts", () => ({
  Author: {
    findByPk: jest.fn(),
  },
}));

jest.mock("../models/book.model.ts", () => ({
  Book: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock("../models/shelf.model.ts", () => ({
  Shelf: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
}));

import sequelize from "../config/db.ts";
import { Author } from "../models/author.model.ts";
import { Book } from "../models/book.model.ts";
import { Shelf } from "../models/shelf.model.ts";

const mockedSequelize = sequelize as jest.Mocked<typeof sequelize>;
const mockedAuthor = Author as jest.Mocked<typeof Author>;
const mockedBook = Book as jest.Mocked<typeof Book>;
const mockedShelf = Shelf as jest.Mocked<typeof Shelf>;

describe("Books Service", () => {
  let mockTransaction: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    mockedSequelize.transaction.mockResolvedValue(mockTransaction as never);
  });

  describe("createBook", () => {
    it("should throw an error if author not found", async () => {
      mockedAuthor.findByPk.mockResolvedValue(null);

      await expect(
        BookService.createBook({ title: "Test Book", publicationYear: 2024, authorId: 1 })
      ).rejects.toThrow("Author not found");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should create a book successfully without shelves", async () => {
      const mockAuthor = { id: 1 };
      const mockBook = { id: 1, title: "Test Book", publicationYear: 2024, addShelves: jest.fn() };
      const mockBookWithShelves = { ...mockBook, shelves: [] };

      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);
      mockedBook.create.mockResolvedValue(mockBook as never);
      mockedBook.findByPk.mockResolvedValue(mockBookWithShelves as never);

      const result = await BookService.createBook({
        title: "Test Book",
        publicationYear: 2024,
        authorId: 1,
      });

      expect(result).toEqual(mockBookWithShelves);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("should create a book with shelves", async () => {
      const mockAuthor = { id: 1 };
      const mockShelf1 = { id: 1, name: "Fiction" };
      const mockShelf2 = { id: 2, name: "Classics" };
      const mockBook = { id: 1, title: "Test Book", publicationYear: 2024, addShelves: jest.fn() };
      const mockBookWithShelves = { ...mockBook, shelves: [mockShelf1, mockShelf2] };

      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);
      mockedBook.create.mockResolvedValue(mockBook as never);
      mockedShelf.findByPk
        .mockResolvedValueOnce(mockShelf1 as never)
        .mockResolvedValueOnce(mockShelf2 as never);
      mockedBook.findByPk.mockResolvedValue(mockBookWithShelves as never);

      const result = await BookService.createBook({
        title: "Test Book",
        publicationYear: 2024,
        authorId: 1,
        shelfIds: [1, 2],
      });

      expect(result).toEqual(mockBookWithShelves);
      expect(mockBook.addShelves).toHaveBeenCalledWith([mockShelf1, mockShelf2], {
        transaction: mockTransaction,
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("should rollback if one or more shelves not found", async () => {
      const mockAuthor = { id: 1 };
      const mockBook = { id: 1, title: "Test Book", addShelves: jest.fn() };

      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);
      mockedBook.create.mockResolvedValue(mockBook as never);
      mockedShelf.findByPk.mockResolvedValueOnce({ id: 1 } as never).mockResolvedValueOnce(null);

      await expect(
        BookService.createBook({
          title: "Test Book",
          publicationYear: 2024,
          authorId: 1,
          shelfIds: [1, 999],
        })
      ).rejects.toThrow("One or more shelves not found");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("fetchAllBooks", () => {
    it("should return all books with shelves", async () => {
      const mockBooks = [
        { id: 1, title: "Book 1", shelves: [] },
        { id: 2, title: "Book 2", shelves: [] },
      ];
      mockedBook.findAll.mockResolvedValue(mockBooks as never);

      const result = await BookService.fetchAllBooks();

      expect(result).toEqual(mockBooks);
      expect(mockedBook.findAll).toHaveBeenCalledWith({
        include: [{ model: Shelf, as: "shelves" }],
      });
    });
  });

  describe("fetchBookById", () => {
    it("should return a book by id", async () => {
      const mockBook = { id: 1, title: "Test Book", shelves: [] };
      mockedBook.findByPk.mockResolvedValue(mockBook as never);

      const result = await BookService.fetchBookById("1");

      expect(result).toEqual(mockBook);
      expect(mockedBook.findByPk).toHaveBeenCalledWith("1", {
        include: [{ model: Shelf, as: "shelves" }],
      });
    });
  });

  describe("updateBook", () => {
    it("should return null if book not found", async () => {
      mockedBook.findByPk.mockResolvedValue(null);

      const result = await BookService.updateBook("1", {
        title: "Updated",
        publicationYear: 2024,
        authorId: 1,
      });

      expect(result).toBeNull();
    });

    it("should update a book successfully", async () => {
      const mockBook = { id: 1, title: "Old Title", update: jest.fn(), setShelves: jest.fn() };
      const mockAuthor = { id: 1 };
      const mockUpdatedBook = { id: 1, title: "New Title", shelves: [] };

      mockedBook.findByPk
        .mockResolvedValueOnce(mockBook as never)
        .mockResolvedValueOnce(mockUpdatedBook as never);
      mockedAuthor.findByPk.mockResolvedValue(mockAuthor as never);

      const result = await BookService.updateBook("1", {
        title: "New Title",
        publicationYear: 2024,
        authorId: 1,
      });

      expect(result).toEqual(mockUpdatedBook);
      expect(mockBook.update).toHaveBeenCalledWith(
        { title: "New Title", publicationYear: 2024, authorId: 1 },
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe("deleteBook", () => {
    it("should throw an error if book not found", async () => {
      mockedBook.findByPk.mockResolvedValue(null);

      await expect(BookService.deleteBook("1")).rejects.toThrow("Book not found");
    });

    it("should delete a book successfully", async () => {
      const mockBook = { id: 1, destroy: jest.fn() };
      mockedBook.findByPk.mockResolvedValue(mockBook as never);

      const result = await BookService.deleteBook("1");

      expect(result).toBe("Book deleted");
      expect(mockBook.destroy).toHaveBeenCalled();
    });
  });

  describe("removeBookFromShelf", () => {
    it("should throw an error if book or shelf not found", async () => {
      mockedBook.findByPk.mockResolvedValue(null);
      mockedShelf.findByPk.mockResolvedValue({ id: 1 } as never);

      await expect(BookService.removeBookFromShelf("1", "1")).rejects.toThrow(
        "Book or Shelf not found"
      );
    });

    it("should throw an error if book is not on the shelf", async () => {
      const mockBook = {
        id: 1,
        hasShelf: jest.fn().mockResolvedValue(false),
        removeShelf: jest.fn(),
      };
      const mockShelf = { id: 1 };

      mockedBook.findByPk.mockResolvedValue(mockBook as never);
      mockedShelf.findByPk.mockResolvedValue(mockShelf as never);

      await expect(BookService.removeBookFromShelf("1", "1")).rejects.toThrow(
        "Book is not on the specified shelf"
      );
    });

    it("should remove book from shelf successfully", async () => {
      const mockBook = {
        id: 1,
        hasShelf: jest.fn().mockResolvedValue(true),
        removeShelf: jest.fn(),
      };
      const mockShelf = { id: 1 };

      mockedBook.findByPk.mockResolvedValue(mockBook as never);
      mockedShelf.findByPk.mockResolvedValue(mockShelf as never);

      const result = await BookService.removeBookFromShelf("1", "1");

      expect(result).toBe("Book removed from shelf");
      expect(mockBook.removeShelf).toHaveBeenCalledWith(mockShelf);
    });
  });

  describe("fetchBookShelves", () => {
    it("should return null if book not found", async () => {
      mockedBook.findByPk.mockResolvedValue(null);

      const result = await BookService.fetchBookShelves("1");

      expect(result).toBeNull();
    });

    it("should return book shelves", async () => {
      const mockShelves = [
        { id: 1, name: "Fiction" },
        { id: 2, name: "Classics" },
      ];
      const mockBook = { id: 1, shelves: mockShelves };
      mockedBook.findByPk.mockResolvedValue(mockBook as never);

      const result = await BookService.fetchBookShelves("1");

      expect(result).toEqual(mockShelves);
    });
  });
});
