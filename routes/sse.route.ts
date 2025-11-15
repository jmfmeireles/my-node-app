import { Router } from "express";
import { connectSSE, getSSEStats, subscribeToTopic, unsubscribeFromTopic } from "../controllers/sse.controller.ts";

const router = Router();

router.get("/events", connectSSE);
router.get("/stats", getSSEStats);
router.post("/subscribe/:clientId/:topic", subscribeToTopic);
router.post("/unsubscribe/:clientId/:topic", unsubscribeFromTopic);


export default router;
