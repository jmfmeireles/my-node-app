import type { Request, Response, NextFunction } from "express";
import * as AuthorsController from "./authors.controller.ts";
import * as AuthorService from "../services/authors.service.ts";

jest.mock("../services/authors.service.ts");

const mockedAuthorService = AuthorService as jest.Mocked<typeof AuthorService>;

describe("Authors Controller", () => {
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

  describe("createAuthor", () => {
    it("should create an author and return 200", async () => {
      const authorData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        dateOfBirth: new Date(),
      };
      const createdAuthor = { id: 1, ...authorData };

      mockReq.body = authorData;
      mockedAuthorService.createAuthor.mockResolvedValue(createdAuthor as any);

      await AuthorsController.createAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAuthorService.createAuthor).toHaveBeenCalledWith(authorData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(createdAuthor);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Create failed");
      mockedAuthorService.createAuthor.mockRejectedValue(error);

      await AuthorsController.createAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getAllAuthors", () => {
    it("should return all authors with 200", async () => {
      const authors = [
        { id: 1, firstName: "John", lastName: "Doe" },
        { id: 2, firstName: "Jane", lastName: "Smith" },
      ];
      mockedAuthorService.fetchAllAuthors.mockResolvedValue(authors as any);

      await AuthorsController.getAllAuthors(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAuthorService.fetchAllAuthors).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(authors);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockedAuthorService.fetchAllAuthors.mockRejectedValue(error);

      await AuthorsController.getAllAuthors(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getAuthorById", () => {
    it("should return author with 200 when found", async () => {
      const author = { id: 1, firstName: "John", lastName: "Doe" };
      mockReq.params = { id: "1" };
      mockedAuthorService.fetchAuthorById.mockResolvedValue(author as any);

      await AuthorsController.getAuthorById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedAuthorService.fetchAuthorById).toHaveBeenCalledWith("1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(author);
    });

    it("should return 404 when author not found", async () => {
      mockReq.params = { id: "999" };
      mockedAuthorService.fetchAuthorById.mockResolvedValue(null);

      await AuthorsController.getAuthorById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Author not found" });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockReq.params = { id: "1" };
      mockedAuthorService.fetchAuthorById.mockRejectedValue(error);

      await AuthorsController.getAuthorById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateAuthor", () => {
    it("should update author and return 200", async () => {
      const updateData = { firstName: "John", lastName: "Updated" };
      const updatedAuthor = { id: 1, ...updateData };
      mockReq.params = { id: "1" };
      mockReq.body = updateData;
      mockedAuthorService.updateAuthor.mockResolvedValue(updatedAuthor as any);

      await AuthorsController.updateAuthor(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedAuthorService.updateAuthor).toHaveBeenCalledWith("1", updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedAuthor);
    });

    it("should return 404 when author not found", async () => {
      mockReq.params = { id: "999" };
      mockReq.body = { firstName: "Test" };
      mockedAuthorService.updateAuthor.mockResolvedValue(null);

      await AuthorsController.updateAuthor(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Author not found" });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Update failed");
      mockReq.params = { id: "1" };
      mockedAuthorService.updateAuthor.mockRejectedValue(error);

      await AuthorsController.updateAuthor(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteAuthor", () => {
    it("should delete author and return 200 with message", async () => {
      const message = "Author deleted successfully";
      mockReq.params = { id: "1" };
      mockedAuthorService.deleteAuthor.mockResolvedValue(message);

      await AuthorsController.deleteAuthor(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedAuthorService.deleteAuthor).toHaveBeenCalledWith("1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Delete failed");
      mockReq.params = { id: "1" };
      mockedAuthorService.deleteAuthor.mockRejectedValue(error);

      await AuthorsController.deleteAuthor(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("restoreAuthor", () => {
    it("should restore author and return 200 with message", async () => {
      const message = "Author restored successfully";
      mockReq.params = { id: "1" };
      mockedAuthorService.restoreAuthor.mockResolvedValue(message);

      await AuthorsController.restoreAuthor(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedAuthorService.restoreAuthor).toHaveBeenCalledWith("1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Restore failed");
      mockReq.params = { id: "1" };
      mockedAuthorService.restoreAuthor.mockRejectedValue(error);

      await AuthorsController.restoreAuthor(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
