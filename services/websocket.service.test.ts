import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";

jest.mock("ws");
jest.mock("./movies.service.ts");
jest.mock("../config/mongo.ts", () => ({
  default: null,
}));

import { WebSocketService } from "./websocket.service.ts";
import * as moviesService from "./movies.service.ts";

const mockedMoviesService = moviesService as jest.Mocked<typeof moviesService>;

describe("WebSocketService", () => {
  let websocketService: WebSocketService;
  let mockServer: Server;
  let mockWss: jest.Mocked<WebSocketServer>;
  let mockWs: jest.Mocked<WebSocket>;

  beforeEach(() => {
    websocketService = new WebSocketService();
    mockServer = {} as Server;
    
    mockWs = {
      send: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<WebSocket>;

    mockWss = {
      on: jest.fn(),
      clients: new Set([mockWs]),
    } as unknown as jest.Mocked<WebSocketServer>;

    (WebSocketServer as jest.MockedClass<typeof WebSocketServer>).mockImplementation(() => mockWss);

    jest.clearAllMocks();
  });

  describe("initialize", () => {
    it("should create WebSocket server with correct configuration", () => {
      websocketService.initialize(mockServer);

      expect(WebSocketServer).toHaveBeenCalledWith({ server: mockServer, path: "/ws" });
      expect(mockWss.on).toHaveBeenCalledWith("connection", expect.any(Function));
    });

    it("should handle new WebSocket connections", () => {
      websocketService.initialize(mockServer);

      const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === "connection")?.[1];
      expect(connectionHandler).toBeDefined();

      connectionHandler!(mockWs);

      expect(mockWs.on).toHaveBeenCalledWith("message", expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith("close", expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "connected", message: "WebSocket connected" })
      );
    });
  });

  describe("message handling", () => {
    let messageHandler: (message: Buffer) => void;

    beforeEach(() => {
      websocketService.initialize(mockServer);
      const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === "connection")?.[1];
      connectionHandler!(mockWs);
      
      messageHandler = mockWs.on.mock.calls.find(call => call[0] === "message")?.[1] as (message: Buffer) => void;
    });

    it("should handle getMovieDetails message successfully", async () => {
      const mockMovie = {
        _id: "507f1f77bcf86cd799439011",
        title: "The Matrix",
        plot: "A hacker discovers reality",
        year: 1999,
      };

      mockedMoviesService.fetchMovieByTitle.mockResolvedValue(mockMovie as any);

      const message = Buffer.from(JSON.stringify({
        type: "getMovieDetails",
        movieName: "The Matrix",
      }));

      await messageHandler(message);

      expect(mockedMoviesService.fetchMovieByTitle).toHaveBeenCalledWith("The Matrix");
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "movieDetails",
          data: mockMovie,
        })
      );
    });

    it("should send error when movie is not found", async () => {
      mockedMoviesService.fetchMovieByTitle.mockResolvedValue(null);

      const message = Buffer.from(JSON.stringify({
        type: "getMovieDetails",
        movieName: "Nonexistent Movie",
      }));

      await messageHandler(message);

      expect(mockedMoviesService.fetchMovieByTitle).toHaveBeenCalledWith("Nonexistent Movie");
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          error: "Movie not found",
        })
      );
    });

    it("should handle unknown message type", async () => {
      const message = Buffer.from(JSON.stringify({
        type: "unknownType",
        data: "something",
      }));

      await messageHandler(message);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          error: "Unknown message type",
        })
      );
    });

    it("should handle invalid JSON message", async () => {
      const message = Buffer.from("invalid json");

      await messageHandler(message);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          error: "Invalid message format",
        })
      );
    });

    it("should handle fetchMovieByTitle error", async () => {
      mockedMoviesService.fetchMovieByTitle.mockRejectedValue(new Error("Database error"));

      const message = Buffer.from(JSON.stringify({
        type: "getMovieDetails",
        movieName: "The Matrix",
      }));

      await messageHandler(message);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          error: "Failed to fetch movie details",
        })
      );
    });
  });

  describe("connection lifecycle", () => {
    it("should handle WebSocket close event", () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      
      websocketService.initialize(mockServer);
      const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === "connection")?.[1];
      connectionHandler!(mockWs);

      const closeHandler = mockWs.on.mock.calls.find(call => call[0] === "close")?.[1] as () => void;
      closeHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith("WebSocket client disconnected");
      
      consoleLogSpy.mockRestore();
    });

    it("should handle WebSocket error event", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      
      websocketService.initialize(mockServer);
      const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === "connection")?.[1];
      connectionHandler!(mockWs);

      const errorHandler = mockWs.on.mock.calls.find(call => call[0] === "error")?.[1] as (error: Error) => void;
      const testError = new Error("Connection error");
      errorHandler(testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith("WebSocket error:", testError);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getConnectedClients", () => {
    it("should return number of connected clients", () => {
      websocketService.initialize(mockServer);

      const count = websocketService.getConnectedClients();

      expect(count).toBe(1);
    });

    it("should return 0 when WebSocket server is not initialized", () => {
      const count = websocketService.getConnectedClients();

      expect(count).toBe(0);
    });

    it("should return correct count with multiple clients", () => {
      const mockWs2 = {} as WebSocket;
      const mockWs3 = {} as WebSocket;
      
      mockWss.clients = new Set([mockWs, mockWs2, mockWs3]);

      websocketService.initialize(mockServer);

      const count = websocketService.getConnectedClients();

      expect(count).toBe(3);
    });
  });
});
