import type { Request, Response } from "express";
import { ValidationError, ValidationErrorItem } from "sequelize";
import { errorMiddleware } from "./error.middleware.ts";

describe("Error Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("ValidationError handling", () => {
    it("should return 400 for Sequelize ValidationError", () => {
      const validationErrors = [
        { message: "Name is required" } as ValidationErrorItem,
        { message: "Email must be valid" } as ValidationErrorItem,
      ];
      const err = new ValidationError("Validation failed", validationErrors);

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Validation error",
          details: ["Name is required", "Email must be valid"],
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle ValidationError with single error", () => {
      const validationErrors = [{ message: "Invalid input" } as ValidationErrorItem];
      const err = new ValidationError("Validation failed", validationErrors);

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Validation error",
          details: ["Invalid input"],
        },
      });
    });
  });

  describe("404 Error handling", () => {
    it("should return 404 for not found errors", () => {
      const err = new Error("User not found") as any;
      err.status = 404;

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Resource not found",
          details: "User not found",
        },
      });
    });

    it("should handle 404 error without message", () => {
      const err = new Error() as any;
      err.status = 404;

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Resource not found",
          details: null,
        },
      });
    });
  });

  describe("Generic error handling", () => {
    it("should return 500 for unhandled errors", () => {
      const err = new Error("Something went wrong");

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Something went wrong",
          details: null,
        },
      });
    });

    it("should use custom status code if provided", () => {
      const err = new Error("Forbidden") as any;
      err.status = 403;

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Forbidden",
          details: null,
        },
      });
    });

    it("should include details if provided", () => {
      const err = new Error("Bad Request") as any;
      err.status = 400;
      err.details = { field: "email", reason: "invalid format" };

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Bad Request",
          details: { field: "email", reason: "invalid format" },
        },
      });
    });

    it("should default to Internal Server Error when no message", () => {
      const err = new Error() as any;

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: "Internal Server Error",
          details: null,
        },
      });
    });

    it("should log error stack", () => {
      const err = new Error("Test error");

      errorMiddleware(err, mockReq as Request, mockRes as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);
    });
  });
});
