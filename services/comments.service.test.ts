import { ObjectId } from "mongodb";
import db from "../config/mongo.ts";
import * as CommentsService from "./comments.service.ts";
import type { Comment } from "../models/movie.model.ts";

jest.mock("../config/mongo.ts", () => ({
  __esModule: true,
  default: {
    collection: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;

describe("Comments Service", () => {
  let mockCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockedDb.collection = jest.fn().mockReturnValue(mockCollection);
  });

  describe("fetchAllComments", () => {
    it("should return all comments", async () => {
      const mockComments = [
        { _id: new ObjectId(), text: "Comment 1", email: "user1@example.com" },
        { _id: new ObjectId(), text: "Comment 2", email: "user2@example.com" },
      ];
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockComments),
      });

      const result = await CommentsService.fetchAllComments();

      expect(result).toEqual(mockComments);
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });
  });

  describe("fetchPaginatedComments", () => {
    it("should return paginated comments", async () => {
      const mockComments = [
        { _id: new ObjectId(), text: "Comment 1", email: "user1@example.com" },
        { _id: new ObjectId(), text: "Comment 2", email: "user2@example.com" },
      ];
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      });

      const result = await CommentsService.fetchPaginatedComments(1, 10);

      expect(result).toEqual(mockComments);
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });

    it("should calculate correct skip value for page 2", async () => {
      const mockComments = [
        { _id: new ObjectId(), text: "Comment 11", email: "user11@example.com" },
      ];
      const mockFind = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      };
      mockCollection.find.mockReturnValue(mockFind);

      await CommentsService.fetchPaginatedComments(2, 10);

      expect(mockFind.skip).toHaveBeenCalledWith(10);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });
  });

  describe("fetchCommentById", () => {
    it("should return null if comment not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await CommentsService.fetchCommentById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });

    it("should return comment by id", async () => {
      const commentId = new ObjectId();
      const mockComment = { _id: commentId, text: "Test Comment", email: "test@example.com" };
      mockCollection.findOne.mockResolvedValue(mockComment);

      const result = await CommentsService.fetchCommentById(commentId.toString());

      expect(result).toEqual(mockComment);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: commentId });
    });
  });

  describe("createComment", () => {
    it("should create a comment successfully", async () => {
      const newCommentId = new ObjectId();
      const movieId = new ObjectId();
      const newComment = {
        name: "John Doe",
        email: "john@example.com",
        movie_id: movieId,
        text: "Great movie!",
      } as Comment;

      const createdComment = {
        _id: newCommentId,
        ...newComment,
        date: expect.any(String),
      };

      mockCollection.insertOne.mockResolvedValue({ insertedId: newCommentId });
      mockCollection.findOne.mockResolvedValue(createdComment);

      const result = await CommentsService.createComment(newComment);

      expect(result).toEqual(createdComment);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
          movie_id: movieId,
          text: "Great movie!",
          date: expect.any(String),
        })
      );
    });

    it("should throw an error if insert fails", async () => {
      const newComment = {
        name: "Failed User",
        email: "failed@example.com",
        movie_id: new ObjectId(),
        text: "Failed comment",
      } as Comment;

      mockCollection.insertOne.mockResolvedValue({ insertedId: null });

      await expect(CommentsService.createComment(newComment)).rejects.toThrow(
        "Failed to create comment"
      );
    });
  });

  describe("updateComment", () => {
    it("should return null if comment not found", async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      const result = await CommentsService.updateComment("507f1f77bcf86cd799439011", {
        text: "Updated",
      });

      expect(result).toBeNull();
    });

    it("should update comment successfully", async () => {
      const commentId = new ObjectId();
      const updatedComment = {
        _id: commentId,
        text: "Updated Comment",
        email: "test@example.com",
      };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
      mockCollection.findOne.mockResolvedValue(updatedComment);

      const result = await CommentsService.updateComment(commentId.toString(), {
        text: "Updated Comment",
      });

      expect(result).toEqual(updatedComment);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: commentId },
        { $set: { text: "Updated Comment" } }
      );
    });
  });

  describe("deleteComment", () => {
    it("should throw an error if comment not found", async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(CommentsService.deleteComment("507f1f77bcf86cd799439011")).rejects.toThrow(
        "Comment not found"
      );
    });

    it("should delete comment successfully", async () => {
      const commentId = new ObjectId();
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await CommentsService.deleteComment(commentId.toString());

      expect(result).toBe("Comment deleted successfully");
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: commentId });
    });
  });
});
