import express, { raw } from 'express';
import sequelize from '../utils/dbConnection.ts';

import { Book, Shelf } from "../models/sqlTablesModels.ts";

const router = express.Router();

// create a book and add it to several shelves
router.post('/', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { shelfIds, ...bookData } = req.body;
    const book = await Book.create(bookData, { transaction: t });
    console.log('Created Book:', book);

    if (shelfIds && shelfIds.length > 0) {
      const shelves = await Promise.all(
        shelfIds.map(id => sequelize.models.Shelf.findByPk(id, { transaction: t }))
      );
      await book.addShelves(shelves, { transaction: t });
    }

    await t.commit();
    const createdBook = await Book.findByPk(book.id, {
      include: [{ model: Shelf, as: 'shelves' }]
    });
    res.status(201).json(createdBook);
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

//get all books with their shelves
router.get('/', async (req, res, next) => {
  try {
    const books = await Book.findAll({
      include: [{ model: Shelf, as: 'shelves' }]
    });
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

//update a book
router.put('/:id', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { shelfIds, ...bookData } = req.body;
    const book = await Book.findByPk(req.params.id, { transaction: t });

    if (!book) {
      await t.rollback();
      return res.status(404).json({ error: 'Book not found' });
    }

    await book.update(bookData, { transaction: t });

    if (shelfIds) {
      const shelves = await Promise.all(
        shelfIds.map(id => sequelize.models.Shelf.findByPk(id, { transaction: t }))
      );
      await book.setShelves(shelves, { transaction: t });
    }

    await t.commit();
    const updatedBook = await Book.findByPk(book.id, {
      include: [{ model: Shelf, as: 'shelves' }]
    });
    res.status(200).json(updatedBook);
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

//delete a book
router.delete('/:id', async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await book.destroy();
    res.status(200).json({ message: 'Book deleted' });
    } catch (error) {
        next(error);
    }
});

//remove a book from a shelf
router.delete('/:bookId/shelves/:shelfId', async (req, res, next) => {
  try {
    const { bookId, shelfId } = req.params;
    const book = await Book.findByPk(bookId);
    const shelf = await Shelf.findByPk(shelfId);

    if (!book || !shelf) {
      return res.status(404).json({ error: 'Book or Shelf not found' });
    }

    if(!await book.hasShelf(shelf)){
      return res.status(400).json({ error: 'Book is not on the specified shelf' });
    }

    await book.removeShelf(shelf);
    res.status(200).json({ message: 'Book removed from shelf' });
  } catch (error) {
    next(error);
  }
});

//get all the shelves of a book
router.get('/:id/shelves', async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Shelf, as: 'shelves' }]
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(book.shelves);
  } catch (error) {
    next(error);
  }
});

//get all the shelves with their books
router.get('/shelves-with-books', async (req, res, next) => {
  try {
    const shelves = await Shelf.findAll({
      include: [{ model: Book, as: 'books' }]
    });
    res.status(200).json(shelves);
  } catch (error) {
    next(error);
  }
});


export default router;