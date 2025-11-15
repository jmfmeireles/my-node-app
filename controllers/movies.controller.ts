import type { Request, Response, NextFunction } from "express";
import * as MovieService from "../services/movies.service.ts";

export const getAllMovies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movies = await MovieService.fetchAllMovies();
    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
};

export const getPaginatedMovies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const movies = await MovieService.fetchPaginatedMovies(page, limit);
    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeComments = req.query.includeComments === "true";
    const movie = await MovieService.fetchMovieById(req.params.id, includeComments);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.status(200).json(movie);
  } catch (error) {
    next(error);
  }
};

export const createMovie = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movie = await MovieService.createMovie(req.body);
    res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedMovie = await MovieService.updateMovie(req.params.id, req.body);
    if (!updatedMovie) return res.status(404).json({ error: "Movie not found" });
    res.status(200).json(updatedMovie);
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const message = await MovieService.deleteMovie(req.params.id);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};
