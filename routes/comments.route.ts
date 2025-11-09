import { Router } from "express";
import {
  getAllComments,
  getPaginatedComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment
} from "../controllers/comments.controller.ts";

const router = Router();

router.get("/", getAllComments);
router.get("/paginated", getPaginatedComments);
router.get("/:id", getCommentById);
router.post("/", createComment);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;