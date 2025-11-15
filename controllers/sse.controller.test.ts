import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

jest.mock("../services/sse.service.ts", () => ({
  sseService: {
    addClient: jest.fn(),
    getActiveClientsCount: jest.fn(),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
  },
}));

jest.mock("node:crypto", () => ({
  default: {
    randomUUID: jest.fn(),
  },
}));

import * as SSEController from "./sse.controller.ts";
import { sseService } from "../services/sse.service.ts";

const mockedSSEService = sseService as jest.Mocked<typeof sseService>;

describe("SSE Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    jest.clearAllMocks();
    
    // Set up crypto mock to return test UUID
    (crypto.randomUUID as jest.Mock).mockReturnValue("test-uuid-123");
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("connectSSE", () => {
    it("should add client with default topics", () => {
      mockReq.query = {};

      SSEController.connectSSE(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSSEService.addClient).toHaveBeenCalledWith(
        "test-uuid-123",
        mockRes,
        ["all"]
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Client test-uuid-123 connected")
      );
    });

    it("should add client with custom topics", () => {
      mockReq.query = { topics: "comments,all" };

      SSEController.connectSSE(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSSEService.addClient).toHaveBeenCalledWith(
        "test-uuid-123",
        mockRes,
        ["comments", "all"]
      );
    });

    it("should call next with error on failure", () => {
      const error = new Error("Connection failed");
      mockedSSEService.addClient.mockImplementation(() => {
        throw error;
      });

      SSEController.connectSSE(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getSSEStats", () => {
    it("should return active connections count", () => {
      mockedSSEService.getActiveClientsCount.mockReturnValue(5);

      SSEController.getSSEStats(mockReq as Request, mockRes as Response);

      expect(mockedSSEService.getActiveClientsCount).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ activeConnections: 5 });
    });

    it("should return 0 when no active connections", () => {
      mockedSSEService.getActiveClientsCount.mockReturnValue(0);

      SSEController.getSSEStats(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ activeConnections: 0 });
    });
  });

  describe("subscribeToTopic", () => {
    it("should subscribe client to topic", () => {
      mockReq.params = { clientId: "client-123", topic: "comments" };

      SSEController.subscribeToTopic(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSSEService.subscribeToTopic).toHaveBeenCalledWith("client-123", "comments");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Subscribed to topic: comments" });
    });

    it("should call next with error on failure", () => {
      const error = new Error("Subscribe failed");
      mockReq.params = { clientId: "client-123", topic: "comments" };
      mockedSSEService.subscribeToTopic.mockImplementation(() => {
        throw error;
      });

      SSEController.subscribeToTopic(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("unsubscribeFromTopic", () => {
    it("should unsubscribe client from topic", () => {
      mockReq.params = { clientId: "client-123", topic: "comments" };

      SSEController.unsubscribeFromTopic(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSSEService.unsubscribeFromTopic).toHaveBeenCalledWith(
        "client-123",
        "comments"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Unsubscribed from topic: comments" });
    });

    it("should call next with error on failure", () => {
      const error = new Error("Unsubscribe failed");
      mockReq.params = { clientId: "client-123", topic: "comments" };
      mockedSSEService.unsubscribeFromTopic.mockImplementation(() => {
        throw error;
      });

      SSEController.unsubscribeFromTopic(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
