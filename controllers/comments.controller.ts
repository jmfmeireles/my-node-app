import type { Request, Response, NextFunction } from "express";
import * as CommentService from "../services/comments.service.ts";
import * as MoviesService from "../services/movies.service.ts";
import type { Movie } from "../models/movie.model.ts";
import { sseService } from "../services/sse.service.ts";

export const getAllComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await CommentService.fetchAllComments();
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const getPaginatedComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const comments = await CommentService.fetchPaginatedComments(page, limit);
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const getCommentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const comment = await CommentService.fetchCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //get movie id from body
    const movie: Movie | null = await MoviesService.fetchMovieByTitle(req.body.movieTitle);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found for the comment" });
    }

    const newComment = await CommentService.createComment({
      ...req.body,
      movieId: movie._id,
    });

    // Broadcast new comment via SSE
    sseService.broadcast(
      {
        type: "new_comment",
        data: newComment,
        timestamp: new Date().toISOString(),
      },
      "comments"
    );

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedComment = await CommentService.updateComment(req.params.id, req.body);
    if (!updatedComment) return res.status(404).json({ error: "Comment not found" });
    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const message = await CommentService.deleteComment(req.params.id);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};
