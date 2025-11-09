import type { Request, Response, NextFunction } from "express";
import * as AuthorService from "../services/authors.service.ts";

export const createAuthor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthorService.createAuthor(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllAuthors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authors = await AuthorService.fetchAllAuthors();
    res.status(200).json(authors);
  } catch (error) {
    next(error);
  }
};

export const getAuthorById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const author = await AuthorService.fetchAuthorById(req.params.id);
    if (!author) return res.status(404).json({ error: "Author not found" });
    res.status(200).json(author);
  } catch (error) {
    next(error);
  }
};

export const updateAuthor = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const updatedAuthor = await AuthorService.updateAuthor(req.params.id, req.body);
    if (!updatedAuthor) return res.status(404).json({ error: "Author not found" });
    res.status(200).json(updatedAuthor);
  } catch (error) {
    next(error);
  }
};

export const deleteAuthor = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const message = await AuthorService.deleteAuthor(req.params.id);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const restoreAuthor = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const message = await AuthorService.restoreAuthor(req.params.id);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};