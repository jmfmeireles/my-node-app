import { sseService } from "./sse.service.ts";
import type { Response } from "express";

describe("SSE Service", () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };
  });

  describe("addClient", () => {
    it("should add a client with default topics", () => {
      const initialCount = sseService.getActiveClientsCount();
      sseService.addClient("client-1", mockRes as Response);

      expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      expect(sseService.getActiveClientsCount()).toBe(initialCount + 1);
    });

    it("should add a client with custom topics", () => {
      sseService.addClient("client-2", mockRes as Response, ["comments", "movies"]);
      expect(mockRes.writeHead).toHaveBeenCalled();
    });
  });

  describe("removeClient", () => {
    it("should remove an existing client", () => {
      sseService.addClient("client-3", mockRes as Response);
      const countBefore = sseService.getActiveClientsCount();

      sseService.removeClient("client-3");

      expect(mockRes.end).toHaveBeenCalled();
      expect(sseService.getActiveClientsCount()).toBe(countBefore - 1);
    });

    it("should handle removing non-existent client", () => {
      const countBefore = sseService.getActiveClientsCount();
      sseService.removeClient("non-existent");
      expect(sseService.getActiveClientsCount()).toBe(countBefore);
    });
  });

  describe("sendToClient", () => {
    it("should send data to a specific client", () => {
      sseService.addClient("client-4", mockRes as Response);

      const testData = { message: "test" };
      sseService.sendToClient("client-4", testData);

      expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify(testData)}\n\n`);
    });

    it("should not error when sending to non-existent client", () => {
      expect(() => {
        sseService.sendToClient("non-existent", { test: "data" });
      }).not.toThrow();
    });
  });

  describe("broadcast", () => {
    it("should broadcast to all clients on default topic", () => {
      const mockRes1 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };
      const mockRes2 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };

      sseService.addClient("broadcast-1", mockRes1 as unknown as Response);
      sseService.addClient("broadcast-2", mockRes2 as unknown as Response);

      const testData = { type: "test", message: "broadcast test" };
      sseService.broadcast(testData);

      expect(mockRes1.write).toHaveBeenCalled();
      expect(mockRes2.write).toHaveBeenCalled();

      // Cleanup
      sseService.removeClient("broadcast-1");
      sseService.removeClient("broadcast-2");
    });

    it("should broadcast only to clients subscribed to specific topic", () => {
      const mockRes1 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };
      const mockRes2 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };

      sseService.addClient("topic-1", mockRes1 as unknown as Response, ["comments"]);
      sseService.addClient("topic-2", mockRes2 as unknown as Response, ["movies"]);

      const testData = { type: "comment", data: "test" };
      sseService.broadcast(testData, "comments");

      // Only mockRes1 should receive the broadcast
      expect(mockRes1.write).toHaveBeenCalled();

      // Cleanup
      sseService.removeClient("topic-1");
      sseService.removeClient("topic-2");
    });
  });

  describe("topic management", () => {
    it("should subscribe client to a new topic", () => {
      const mockRes1 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };

      sseService.addClient("subscribe-1", mockRes1 as unknown as Response, ["comments"]);
      sseService.subscribeToTopic("subscribe-1", "movies");

      const testData = { type: "movie", data: "test" };
      sseService.broadcast(testData, "movies");

      expect(mockRes1.write).toHaveBeenCalled();

      // Cleanup
      sseService.removeClient("subscribe-1");
    });

    it("should unsubscribe client from a topic", () => {
      const mockRes1 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };

      sseService.addClient("unsubscribe-1", mockRes1 as unknown as Response, [
        "comments",
        "movies",
      ]);
      sseService.unsubscribeFromTopic("unsubscribe-1", "movies");

      // Clear previous calls
      (mockRes1.write as jest.Mock).mockClear();

      const testData = { type: "movie", data: "test" };
      sseService.broadcast(testData, "movies");

      // Should not receive broadcast for unsubscribed topic
      expect(mockRes1.write).not.toHaveBeenCalled();

      // Cleanup
      sseService.removeClient("unsubscribe-1");
    });
  });

  describe("getActiveClientsCount", () => {
    it("should return the correct number of active clients", () => {
      const initialCount = sseService.getActiveClientsCount();

      const mockRes1 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };
      const mockRes2 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };

      sseService.addClient("count-1", mockRes1 as unknown as Response);
      expect(sseService.getActiveClientsCount()).toBe(initialCount + 1);

      sseService.addClient("count-2", mockRes2 as unknown as Response);
      expect(sseService.getActiveClientsCount()).toBe(initialCount + 2);

      sseService.removeClient("count-1");
      expect(sseService.getActiveClientsCount()).toBe(initialCount + 1);

      sseService.removeClient("count-2");
      expect(sseService.getActiveClientsCount()).toBe(initialCount);
    });
  });
});
