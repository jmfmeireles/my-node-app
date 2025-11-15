import * as supertest from "supertest";
import * as express from "express";

// @ts-expect-error - supertest exports function directly
const request = supertest as unknown as typeof supertest.default;

jest.mock("../controllers/authors.controller.ts", () => ({
  createAuthor: jest.fn((req, res) => res.status(201).json({})),
  getAllAuthors: jest.fn((req, res) => res.status(200).json([])),
  getAuthorById: jest.fn((req, res) => res.status(200).json({})),
  updateAuthor: jest.fn((req, res) => res.status(200).json({})),
  deleteAuthor: jest.fn((req, res) => res.status(204).send()),
  restoreAuthor: jest.fn((req, res) => res.status(200).json({})),
}));

import authorsRouter from "./authors.route.ts";
import * as AuthorsController from "../controllers/authors.controller.ts";

const mockedAuthorsController = AuthorsController as jest.Mocked<typeof AuthorsController>;

describe("Authors Routes", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/authors", authorsRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /authors", () => {
    it("should call createAuthor controller", async () => {
      mockedAuthorsController.createAuthor.mockImplementation((req, res) => {
        res.status(200).json({ id: 1, firstName: "John" });
      });

      await request(app).post("/authors").send({ firstName: "John", lastName: "Doe" });

      expect(mockedAuthorsController.createAuthor).toHaveBeenCalled();
    });
  });

  describe("GET /authors", () => {
    it("should call getAllAuthors controller", async () => {
      mockedAuthorsController.getAllAuthors.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get("/authors");

      expect(mockedAuthorsController.getAllAuthors).toHaveBeenCalled();
    });
  });

  describe("GET /authors/:id", () => {
    it("should call getAuthorById controller", async () => {
      mockedAuthorsController.getAuthorById.mockImplementation((req, res) => {
        res.status(200).json({ id: 1 });
      });

      await request(app).get("/authors/1");

      expect(mockedAuthorsController.getAuthorById).toHaveBeenCalled();
    });
  });

  describe("PUT /authors/:id", () => {
    it("should call updateAuthor controller", async () => {
      mockedAuthorsController.updateAuthor.mockImplementation((req, res) => {
        res.status(200).json({ id: 1, firstName: "Updated" });
      });

      await request(app).put("/authors/1").send({ firstName: "Updated" });

      expect(mockedAuthorsController.updateAuthor).toHaveBeenCalled();
    });
  });

  describe("DELETE /authors/:id", () => {
    it("should call deleteAuthor controller", async () => {
      mockedAuthorsController.deleteAuthor.mockImplementation((req, res) => {
        res.status(200).json({ message: "Deleted" });
      });

      await request(app).delete("/authors/1");

      expect(mockedAuthorsController.deleteAuthor).toHaveBeenCalled();
    });
  });

  describe("POST /authors/:id/restore", () => {
    it("should call restoreAuthor controller", async () => {
      mockedAuthorsController.restoreAuthor.mockImplementation((req, res) => {
        res.status(200).json({ message: "Restored" });
      });

      await request(app).post("/authors/1/restore");

      expect(mockedAuthorsController.restoreAuthor).toHaveBeenCalled();
    });
  });
});
