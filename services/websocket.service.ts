import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { fetchMovieByTitle } from "./movies.service.ts";

interface WebSocketMessage {
  type: "getMovieDetails";
  movieName: string;
}

interface WebSocketResponse {
  type: "movieDetails" | "error";
  data?: unknown;
  error?: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WebSocket client connected");

      ws.on("message", async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString()) as WebSocketMessage;

          if (data.type === "getMovieDetails") {
            await this.handleMovieDetailsRequest(ws, data.movieName);
          } else {
            this.sendError(ws, "Unknown message type");
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
          this.sendError(ws, "Invalid message format");
        }
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });

      // Send welcome message
      ws.send(JSON.stringify({ type: "connected", message: "WebSocket connected" }));
    });

    console.log("WebSocket server initialized on path /ws");
  }

  private async handleMovieDetailsRequest(ws: WebSocket, movieName: string): Promise<void> {
    try {
      const movie = await fetchMovieByTitle(movieName);

      if (!movie) {
        this.sendError(ws, "Movie not found");
        return;
      }

      const response: WebSocketResponse = {
        type: "movieDetails",
        data: movie,
      };

      ws.send(JSON.stringify(response));
    } catch (error) {
      console.error("Error fetching movie:", error);
      this.sendError(ws, "Failed to fetch movie details");
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    const response: WebSocketResponse = {
      type: "error",
      error,
    };
    ws.send(JSON.stringify(response));
  }

  getConnectedClients(): number {
    return this.wss?.clients.size || 0;
  }
}

export const websocketService = new WebSocketService();
