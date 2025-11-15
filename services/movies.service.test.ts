import { ObjectId } from "mongodb";
import db from "../config/mongo.ts";
import * as MoviesService from "./movies.service.ts";
import type { Movie } from "../models/movie.model.ts";

jest.mock("../config/mongo.ts", () => ({
  __esModule: true,
  default: {
    collection: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;

describe("Movies Service", () => {
  let mockCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
    };
    mockedDb.collection = jest.fn().mockReturnValue(mockCollection);
  });

  describe("fetchAllMovies", () => {
    it("should return all movies", async () => {
      const mockMovies = [
        { _id: new ObjectId(), title: "Movie 1", year: 2020 },
        { _id: new ObjectId(), title: "Movie 2", year: 2021 },
      ];
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockMovies),
      });

      const result = await MoviesService.fetchAllMovies();

      expect(result).toEqual(mockMovies);
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });
  });

  describe("fetchPaginatedMovies", () => {
    it("should return paginated movies", async () => {
      const mockMovies = [
        { _id: new ObjectId(), title: "Movie 1", year: 2020 },
        { _id: new ObjectId(), title: "Movie 2", year: 2021 },
      ];
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockMovies),
      });

      const result = await MoviesService.fetchPaginatedMovies(2, 10);

      expect(result).toEqual(mockMovies);
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });
  });

  describe("fetchMovieById", () => {
    it("should return null if movie not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await MoviesService.fetchMovieById("507f1f77bcf86cd799439011", false);

      expect(result).toBeNull();
    });

    it("should return movie without comments", async () => {
      const movieId = new ObjectId();
      const mockMovie = { _id: movieId, title: "Test Movie", year: 2023 };
      mockCollection.findOne.mockResolvedValue(mockMovie);

      const result = await MoviesService.fetchMovieById(movieId.toString(), false);

      expect(result).toEqual(mockMovie);
      expect(mockedDb.collection).toHaveBeenCalledWith("movies");
    });

    it("should return movie with comments", async () => {
      const movieId = new ObjectId();
      const mockMovie = { _id: movieId, title: "Test Movie", year: 2023 };
      const mockComments = [
        { _id: new ObjectId(), text: "Great movie!", movie_id: movieId },
        { _id: new ObjectId(), text: "Loved it!", movie_id: movieId },
      ];

      mockedDb.collection = jest.fn((collectionName: string) => {
        if (collectionName === "movies") {
          return { ...mockCollection, findOne: jest.fn().mockResolvedValue(mockMovie) };
        }
        if (collectionName === "comments") {
          return {
            ...mockCollection,
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockComments),
            }),
          };
        }
        return mockCollection;
      }) as any;

      const result = await MoviesService.fetchMovieById(movieId.toString(), true);

      expect(result).toEqual({ ...mockMovie, comments: mockComments });
    });
  });

  describe("createMovie", () => {
    it("should create a movie successfully", async () => {
      const newMovieId = new ObjectId();
      const newMovie = { title: "New Movie", year: 2024 } as Movie;
      const createdMovie = { _id: newMovieId, ...newMovie };

      mockCollection.insertOne.mockResolvedValue({ insertedId: newMovieId });
      mockCollection.findOne.mockResolvedValue(createdMovie);

      const result = await MoviesService.createMovie(newMovie);

      expect(result).toEqual(createdMovie);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(newMovie);
    });

    it("should throw an error if insert fails", async () => {
      const newMovie = { title: "Failed Movie", year: 2024 } as Movie;
      mockCollection.insertOne.mockResolvedValue({ insertedId: null });

      await expect(MoviesService.createMovie(newMovie)).rejects.toThrow("Failed to create movie");
    });
  });

  describe("updateMovie", () => {
    it("should return null if movie not found", async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      const result = await MoviesService.updateMovie("507f1f77bcf86cd799439011", {
        title: "Updated",
      });

      expect(result).toBeNull();
    });

    it("should update movie successfully", async () => {
      const movieId = new ObjectId();
      const updatedMovie = { _id: movieId, title: "Updated Movie", year: 2024 };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
      mockCollection.findOne.mockResolvedValue(updatedMovie);

      const result = await MoviesService.updateMovie(movieId.toString(), {
        title: "Updated Movie",
      });

      expect(result).toEqual(updatedMovie);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: movieId },
        { $set: { title: "Updated Movie" } }
      );
    });
  });

  describe("deleteMovie", () => {
    it("should throw an error if movie not found", async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(MoviesService.deleteMovie("507f1f77bcf86cd799439011")).rejects.toThrow(
        "Movie not found"
      );
    });

    it("should delete movie without comments", async () => {
      const movieId = new ObjectId();

      mockedDb.collection = jest.fn((collectionName: string) => {
        if (collectionName === "movies") {
          return { ...mockCollection, deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }) };
        }
        if (collectionName === "comments") {
          return {
            ...mockCollection,
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
          };
        }
        return mockCollection;
      }) as any;

      const result = await MoviesService.deleteMovie(movieId.toString());

      expect(result).toBe("Movie deleted.");
    });

    it("should delete movie with associated comments", async () => {
      const movieId = new ObjectId();

      mockedDb.collection = jest.fn((collectionName: string) => {
        if (collectionName === "movies") {
          return { ...mockCollection, deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }) };
        }
        if (collectionName === "comments") {
          return {
            ...mockCollection,
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }),
          };
        }
        return mockCollection;
      }) as any;

      const result = await MoviesService.deleteMovie(movieId.toString());

      expect(result).toBe("Movie deleted. Also deleted 5 associated comment(s).");
    });
  });
});
