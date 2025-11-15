import * as supertest from "supertest";
import * as express from "express";

// @ts-expect-error - supertest exports function directly
const request = supertest as unknown as typeof supertest.default;

jest.mock("../controllers/books.controller.ts", () => ({
  createBook: jest.fn((req, res) => res.status(201).json({})),
  getAllBooks: jest.fn((req, res) => res.status(200).json([])),
  getShelvesWithBooks: jest.fn((req, res) => res.status(200).json([])),
  getBookById: jest.fn((req, res) => res.status(200).json({})),
  updateBook: jest.fn((req, res) => res.status(200).json({})),
  deleteBook: jest.fn((req, res) => res.status(204).send()),
  removeBookFromShelf: jest.fn((req, res) => res.status(204).send()),
  getBookShelves: jest.fn((req, res) => res.status(200).json([])),
}));

import booksRouter from "./books.route.ts";
import * as BooksController from "../controllers/books.controller.ts";

const mockedBooksController = BooksController as jest.Mocked<typeof BooksController>;

describe("Books Routes", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/books", booksRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /books", () => {
    it("should call createBook controller", async () => {
      mockedBooksController.createBook.mockImplementation((req, res) => {
        res.status(201).json({ id: 1, title: "Test Book" });
      });

      await request(app).post("/books").send({ title: "Test Book", authorId: 1 });

      expect(mockedBooksController.createBook).toHaveBeenCalled();
    });
  });

  describe("GET /books", () => {
    it("should call getAllBooks controller", async () => {
      mockedBooksController.getAllBooks.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get("/books");

      expect(mockedBooksController.getAllBooks).toHaveBeenCalled();
    });
  });

  describe("GET /books/shelves-with-books", () => {
    it("should call getShelvesWithBooks controller", async () => {
      mockedBooksController.getShelvesWithBooks.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get("/books/shelves-with-books");

      expect(mockedBooksController.getShelvesWithBooks).toHaveBeenCalled();
    });
  });

  describe("GET /books/:id", () => {
    it("should call getBookById controller", async () => {
      mockedBooksController.getBookById.mockImplementation((req, res) => {
        res.status(200).json({ id: 1 });
      });

      await request(app).get("/books/1");

      expect(mockedBooksController.getBookById).toHaveBeenCalled();
    });
  });

  describe("PUT /books/:id", () => {
    it("should call updateBook controller", async () => {
      mockedBooksController.updateBook.mockImplementation((req, res) => {
        res.status(200).json({ id: 1, title: "Updated" });
      });

      await request(app).put("/books/1").send({ title: "Updated" });

      expect(mockedBooksController.updateBook).toHaveBeenCalled();
    });
  });

  describe("DELETE /books/:id", () => {
    it("should call deleteBook controller", async () => {
      mockedBooksController.deleteBook.mockImplementation((req, res) => {
        res.status(200).json({ message: "Deleted" });
      });

      await request(app).delete("/books/1");

      expect(mockedBooksController.deleteBook).toHaveBeenCalled();
    });
  });

  describe("DELETE /books/:bookId/shelves/:shelfId", () => {
    it("should call removeBookFromShelf controller", async () => {
      mockedBooksController.removeBookFromShelf.mockImplementation((req, res) => {
        res.status(200).json({ message: "Removed" });
      });

      await request(app).delete("/books/1/shelves/2");

      expect(mockedBooksController.removeBookFromShelf).toHaveBeenCalled();
    });
  });

  describe("GET /books/:id/shelves", () => {
    it("should call getBookShelves controller", async () => {
      mockedBooksController.getBookShelves.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get("/books/1/shelves");

      expect(mockedBooksController.getBookShelves).toHaveBeenCalled();
    });
  });
});
