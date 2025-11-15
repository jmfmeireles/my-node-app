import type { Response } from "express";

interface SSEClient {
  id: string;
  res: Response;
  topics: Set<string>;
}

class SSEService {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, res: Response, topics: string[] = ["all"]) {
    const client: SSEClient = {
      id,
      res,
      topics: new Set(topics),
    };

    this.clients.set(id, client);

    // Set up SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial connection message with clientId
    this.sendToClient(id, { type: "connected", message: "SSE connection established", clientId: id });

    // Handle client disconnect
    res.on("close", () => {
      this.removeClient(id);
    });
  }

  removeClient(id: string) {
    const client = this.clients.get(id);
    if (client) {
      client.res.end();
      this.clients.delete(id);
      console.log(`Client ${id} disconnected. Active clients: ${this.clients.size}`);
    }
  }

  sendToClient(id: string, data: unknown) {
    const client = this.clients.get(id);
    if (client) {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  broadcast(data: unknown, topic = "all") {
    let sentCount = 0;
    this.clients.forEach((client) => {
      if (client.topics.has(topic) || client.topics.has("all")) {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        sentCount++;
      }
    });
    console.log(`Broadcast to ${sentCount} clients on topic: ${topic}`);
  }

  getActiveClientsCount(): number {
    return this.clients.size;
  }

  subscribeToTopic(clientId: string, topic: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.topics.add(topic);
    }
  }

  unsubscribeFromTopic(clientId: string, topic: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.topics.delete(topic);
    }
  }
}

export const sseService = new SSEService();
