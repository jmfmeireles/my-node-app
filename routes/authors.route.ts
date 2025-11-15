import { Router } from "express";
import {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  restoreAuthor,
} from "../controllers/authors.controller.ts";

const router = Router();

router.post("/", createAuthor);
router.get("/", getAllAuthors);
router.get("/:id", getAuthorById);
router.put("/:id", updateAuthor);
router.delete("/:id", deleteAuthor);
router.post("/:id/restore", restoreAuthor);

export default router;
