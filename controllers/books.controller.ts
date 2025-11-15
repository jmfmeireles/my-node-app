import type { Request, Response, NextFunction } from "express";
import * as BookService from "../services/books.service.ts";

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await BookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};

export const getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await BookService.fetchAllBooks();
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

export const getShelvesWithBooks = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const shelves = await BookService.fetchShelvesWithBooks();
    res.status(200).json(shelves);
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const book = await BookService.fetchBookById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedBook = await BookService.updateBook(req.params.id, req.body);
    if (!updatedBook) return res.status(404).json({ error: "Book not found" });
    res.status(200).json(updatedBook);
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const message = await BookService.deleteBook(req.params.id);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const removeBookFromShelf = async (
  req: Request<{ bookId: string; shelfId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const message = await BookService.removeBookFromShelf(req.params.bookId, req.params.shelfId);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const getBookShelves = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const shelves = await BookService.fetchBookShelves(req.params.id);
    if (!shelves) return res.status(404).json({ error: "Book not found" });
    res.status(200).json(shelves);
  } catch (error) {
    next(error);
  }
};
