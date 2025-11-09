import { Router } from "express";
import {
  getAllMovies,
  getPaginatedMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
} from "../controllers/movies.controller.ts";

const router = Router();

router.get("/", getAllMovies);
router.get("/paginated", getPaginatedMovies);
router.get("/:id", getMovieById);
router.post("/", createMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

export default router;