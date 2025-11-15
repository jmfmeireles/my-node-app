import type { Request, Response, NextFunction } from "express";

jest.mock("../services/comments.service.ts", () => ({
  fetchAllComments: jest.fn(),
  fetchPaginatedComments: jest.fn(),
  fetchCommentById: jest.fn(),
  createComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}));

import * as CommentsController from "./comments.controller.ts";
import * as CommentService from "../services/comments.service.ts";

const mockedCommentService = CommentService as jest.Mocked<typeof CommentService>;

describe("Comments Controller", () => {
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

  describe("getAllComments", () => {
    it("should return all comments with 200", async () => {
      const comments = [
        { _id: "1", text: "Comment 1" },
        { _id: "2", text: "Comment 2" },
      ];
      mockedCommentService.fetchAllComments.mockResolvedValue(comments as any);

      await CommentsController.getAllComments(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedCommentService.fetchAllComments).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(comments);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockedCommentService.fetchAllComments.mockRejectedValue(error);

      await CommentsController.getAllComments(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getPaginatedComments", () => {
    it("should return paginated comments with default page and limit", async () => {
      const comments = [{ _id: "1", text: "Comment 1" }];
      mockReq.query = {};
      mockedCommentService.fetchPaginatedComments.mockResolvedValue(comments as any);

      await CommentsController.getPaginatedComments(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockedCommentService.fetchPaginatedComments).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(comments);
    });

    it("should return paginated comments with custom page and limit", async () => {
      const comments = [{ _id: "1", text: "Comment 1" }];
      mockReq.query = { page: "3", limit: "15" };
      mockedCommentService.fetchPaginatedComments.mockResolvedValue(comments as any);

      await CommentsController.getPaginatedComments(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockedCommentService.fetchPaginatedComments).toHaveBeenCalledWith(3, 15);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(comments);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockedCommentService.fetchPaginatedComments.mockRejectedValue(error);

      await CommentsController.getPaginatedComments(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getCommentById", () => {
    it("should return comment with 200 when found", async () => {
      const comment = { _id: "1", text: "Test Comment" };
      mockReq.params = { id: "1" };
      mockedCommentService.fetchCommentById.mockResolvedValue(comment as any);

      await CommentsController.getCommentById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedCommentService.fetchCommentById).toHaveBeenCalledWith("1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(comment);
    });

    it("should return 404 when comment not found", async () => {
      mockReq.params = { id: "999" };
      mockedCommentService.fetchCommentById.mockResolvedValue(null);

      await CommentsController.getCommentById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Comment not found" });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Fetch failed");
      mockReq.params = { id: "1" };
      mockedCommentService.fetchCommentById.mockRejectedValue(error);

      await CommentsController.getCommentById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createComment", () => {
    it("should create a comment and return 201", async () => {
      const commentData = { text: "New Comment", name: "User", email: "user@test.com" };
      const createdComment = { _id: "1", ...commentData };

      mockReq.body = commentData;
      mockedCommentService.createComment.mockResolvedValue(createdComment as any);

      await CommentsController.createComment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedCommentService.createComment).toHaveBeenCalledWith(commentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdComment);
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Create failed");
      mockedCommentService.createComment.mockRejectedValue(error);

      await CommentsController.createComment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateComment", () => {
    it("should update comment and return 200", async () => {
      const updateData = { text: "Updated Comment" };
      const updatedComment = { _id: "1", ...updateData };
      mockReq.params = { id: "1" };
      mockReq.body = updateData;
      mockedCommentService.updateComment.mockResolvedValue(updatedComment as any);

      await CommentsController.updateComment(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedCommentService.updateComment).toHaveBeenCalledWith("1", updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedComment);
    });

    it("should return 404 when comment not found", async () => {
      mockReq.params = { id: "999" };
      mockReq.body = { text: "Test" };
      mockedCommentService.updateComment.mockResolvedValue(null);

      await CommentsController.updateComment(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Comment not found" });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Update failed");
      mockReq.params = { id: "1" };
      mockedCommentService.updateComment.mockRejectedValue(error);

      await CommentsController.updateComment(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteComment", () => {
    it("should delete comment and return 200 with message", async () => {
      const message = "Comment deleted successfully";
      mockReq.params = { id: "1" };
      mockedCommentService.deleteComment.mockResolvedValue(message);

      await CommentsController.deleteComment(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockedCommentService.deleteComment).toHaveBeenCalledWith("1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message });
    });

    it("should call next with error on failure", async () => {
      const error = new Error("Delete failed");
      mockReq.params = { id: "1" };
      mockedCommentService.deleteComment.mockRejectedValue(error);

      await CommentsController.deleteComment(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
