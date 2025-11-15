import type { Request, Response, NextFunction } from "express";
import { sseService } from "../services/sse.service.ts";
import crypto from "node:crypto";

export const connectSSE = (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = crypto.randomUUID();
    const topics = req.query.topics ? (req.query.topics as string).split(",") : ["all"];

    sseService.addClient(clientId, res, topics);

    console.log(
      `Client ${clientId} connected. Active clients: ${sseService.getActiveClientsCount()}`
    );
  } catch (error) {
    next(error);
  }
};

export const getSSEStats = (req: Request, res: Response) => {
  res.status(200).json({
    activeConnections: sseService.getActiveClientsCount(),
  });
};

export const subscribeToTopic = (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.params.clientId;
    const topic = req.params.topic;

    sseService.subscribeToTopic(clientId, topic);

    res.status(200).json({ message: `Subscribed to topic: ${topic}` });
  } catch (error) {
    next(error);
  }
};

export const unsubscribeFromTopic = (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.params.clientId;
    const topic = req.params.topic;

    sseService.unsubscribeFromTopic(clientId, topic);

    res.status(200).json({ message: `Unsubscribed from topic: ${topic}` });
  } catch (error) {
    next(error);
  }
};
