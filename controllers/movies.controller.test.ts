import type { Request, Response, NextFunction } from "express";

jest.mock("../services/movies.service.ts", () => ({
  fetchAllMovies: jest.fn(),
  fetchPaginatedMovies: jest.fn(),
  fetchMovieById: jest.fn(),
  createMovie: jest.fn(),
  updateMovie: jest.fn(),
  deleteMovie: jest.fn(),
}));

import * as MoviesController from "./movies.controller.ts";
import * as MovieService from "../services/movies.service.ts";

const mockedMovieService = MovieService as jest.Mocked<typeof MovieService>;

describe("Movies Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getAllMovies", () => {
    it("should return all movies with 200", async () => {
      const movies = [
        { _id: "1", title: "Movie 1" },
        { _id: "2", title: "Movie 2" },
      ];
      mockedMovieService.fetchAllMovies.mockResolvedValue(movies as any);

      await MoviesController.getAllMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMovieService.fetchAllMovies).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(movies);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockedMovieService.fetchAllMovies.mockRejectedValue(error);

      await MoviesController.getAllMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getPaginatedMovies", () => {
    it("should return paginated movies with default page and limit", async () => {
      const movies = [{ _id: "1", title: "Movie 1" }];
      mockReq.query = {};
      mockedMovieService.fetchPaginatedMovies.mockResolvedValue(movies as any);

      await MoviesController.getPaginatedMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMovieService.fetchPaginatedMovies).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(movies);
    });

    it("should return paginated movies with custom page and limit", async () => {
      const movies = [{ _id: "1", title: "Movie 1" }];
      mockReq.query = { page: "2", limit: "20" };
      mockedMovieService.fetchPaginatedMovies.mockResolvedValue(movies as any);

      await MoviesController.getPaginatedMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMovieService.fetchPaginatedMovies).toHaveBeenCalledWith(2, 20);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(movies);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockedMovieService.fetchPaginatedMovies.mockRejectedValue(error);

      await MoviesController.getPaginatedMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getMovieById", () => {
    it("should return movie with 200 when found", async () => {
      const movie = { _id: "1", title: "Test Movie" };
      mockReq.params = { id: "1" };
      mockReq.query = {};
      mockedMovieService.fetchMovieById.mockResolvedValue(movie as any);

      await MoviesController.getMovieById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedMovieService.fetchMovieById).toHaveBeenCalledWith("1", false);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(movie);
    });

    it("should return movie with comments when includeComments is true", async () => {
      const movie = { _id: "1", title: "Test Movie", comments: [] };
      mockReq.params = { id: "1" };
      mockReq.query = { includeComments: "true" };
      mockedMovieService.fetchMovieById.mockResolvedValue(movie as any);

      await MoviesController.getMovieById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedMovieService.fetchMovieById).toHaveBeenCalledWith("1", true);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(movie);
    });

    it("should return 404 when movie not found", async () => {
      mockReq.params = { id: "999" };
      mockReq.query = {};
      mockedMovieService.fetchMovieById.mockResolvedValue(null);

      await MoviesController.getMovieById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Movie not found" });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockReq.params = { id: "1" };
      mockReq.query = {};
      mockedMovieService.fetchMovieById.mockRejectedValue(error);

      await MoviesController.getMovieById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createMovie", () => {
    it("should create a movie and return 201", async () => {
      const movieData = { title: "New Movie", year: 2024 };
      const createdMovie = { _id: "1", ...movieData };

      mockReq.body = movieData;
      mockedMovieService.createMovie.mockResolvedValue(createdMovie as any);

      await MoviesController.createMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMovieService.createMovie).toHaveBeenCalledWith(movieData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdMovie);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Create failed");
      mockedMovieService.createMovie.mockRejectedValue(error);

      await MoviesController.createMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateMovie", () => {
    it("should update movie and return 200", async () => {
      const updateData = { title: "Updated Movie" };
      const updatedMovie = { _id: "1", ...updateData };
      mockReq.params = { id: "1" };
      mockReq.body = updateData;
      mockedMovieService.updateMovie.mockResolvedValue(updatedMovie as any);

      await MoviesController.updateMovie(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedMovieService.updateMovie).toHaveBeenCalledWith("1", updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedMovie);
    });

    it("should return 404 when movie not found", async () => {
      mockReq.params = { id: "999" };
      mockReq.body = { title: "Test" };
      mockedMovieService.updateMovie.mockResolvedValue(null);

      await MoviesController.updateMovie(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Movie not found" });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Update failed");
      mockReq.params = { id: "1" };
      mockedMovieService.updateMovie.mockRejectedValue(error);

      await MoviesController.updateMovie(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteMovie", () => {
    it("should delete movie and return 200 with message", async () => {
      const message = "Movie deleted successfully";
      mockReq.params = { id: "1" };
      mockedMovieService.deleteMovie.mockResolvedValue(message);

      await MoviesController.deleteMovie(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedMovieService.deleteMovie).toHaveBeenCalledWith("1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Delete failed");
      mockReq.params = { id: "1" };
      mockedMovieService.deleteMovie.mockRejectedValue(error);

      await MoviesController.deleteMovie(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
