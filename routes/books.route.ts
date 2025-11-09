import { Router } from "express";
import {
  createBook,
  getAllBooks,
  getShelvesWithBooks,
  getBookById,
  updateBook,
  deleteBook,
  removeBookFromShelf,
  getBookShelves
} from "../controllers/books.controller.ts";

const router = Router();

router.post("/", createBook);
router.get("/", getAllBooks);
router.get("/shelves-with-books", getShelvesWithBooks);
router.get("/:id", getBookById);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);
router.delete("/:bookId/shelves/:shelfId", removeBookFromShelf);
router.get("/:id/shelves", getBookShelves);

export default router;