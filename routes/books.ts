import express, { type Request, type Response, type NextFunction } from 'express';
import sequelize from '../utils/dbConnection.ts';
import { Author, Book, Shelf, type CreateUpdateBookAttributes } from "../models/sqlTablesModels.ts";

const router = express.Router();

// create a book and add it to several shelves
router.post('/', async (req: Request<{}, {}, CreateUpdateBookAttributes>, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction();
  try {
    const { shelfIds, ...bookData } = req.body;

    //check if the author exists
    const author: Author | null = await Author.findByPk(bookData.authorId, { transaction: t });
    if (!author) {
      await t.rollback();
      return res.status(400).json({ error: 'Author not found' });
    }

    const book: Book = await Book.create(bookData, { transaction: t });

    if (shelfIds && shelfIds.length > 0) {
      const shelves: Shelf[] = (await Promise.all(
        shelfIds.map(id => Shelf.findByPk(id, { transaction: t }))
      )).filter((shelf): shelf is Shelf => shelf !== null);

    
      if(shelves.length !== shelfIds.length) {
        await t.rollback();
        return res.status(400).json({ error: 'One or more shelves not found' });
      }

      await book.addShelves(shelves, { transaction: t });
    }

    await t.commit();
    const createdBook: Book = await Book.findByPk(book.id, {
      include: [{ model: Shelf, as: 'shelves' }]
    }) as Book;
    res.status(201).json(createdBook);
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

// get all books with their shelves
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books: Book[] = await Book.findAll({
      include: [{ model: Shelf, as: 'shelves' }]
    });
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

// get a book by id with its shelves
router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const book: Book | null = await Book.findByPk(req.params.id, {
      include: [{ model: Shelf, as: 'shelves' }]
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

// update a book
router.put('/:id', async (req: Request<{ id: string }, {}, CreateUpdateBookAttributes>, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction();
  try {
    const { shelfIds, ...bookData } = req.body;
    const book: Book | null = await Book.findByPk(req.params.id, { transaction: t });

    if (!book) {
      await t.rollback();
      return res.status(404).json({ error: 'Book not found' });
    }

    //check if the author exists
    const author: Author | null = await Author.findByPk(bookData.authorId, { transaction: t });
    if (!author) {
      await t.rollback();
      return res.status(400).json({ error: 'Author not found' });
    }

    await book.update(bookData, { transaction: t });

    if (shelfIds) {
      const shelves: Shelf[] = (await Promise.all(
        shelfIds.map(id => Shelf.findByPk(id, { transaction: t }))
      )).filter((shelf): shelf is Shelf => shelf !== null);

      if(shelves.length !== shelfIds.length) {
        await t.rollback();
        return res.status(400).json({ error: 'One or more shelves not found' });
      }

      await book.setShelves(shelves, { transaction: t });
    }

    await t.commit();
    const updatedBook: Book = await Book.findByPk(book.id, {
      include: [{ model: Shelf, as: 'shelves' }]
    }) as Book;
    res.status(200).json(updatedBook);
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

// delete a book
router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const book: Book | null = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await book.destroy();
    res.status(200).json({ message: 'Book deleted' });
  } catch (error) {
    next(error);
  }
});

// remove a book from a shelf
router.delete('/:bookId/shelves/:shelfId', async (req: Request<{ bookId: string; shelfId: string }>, res: Response, next: NextFunction) => {
  try {
    const { bookId, shelfId } = req.params;
    const book: Book | null = await Book.findByPk(bookId);
    const shelf: Shelf | null = await Shelf.findByPk(shelfId);

    if (!book || !shelf) {
      return res.status(404).json({ error: 'Book or Shelf not found' });
    }

    if (!await book.hasShelf(shelf)) {
      return res.status(400).json({ error: 'Book is not on the specified shelf' });
    }

    await book.removeShelf(shelf);
    res.status(200).json({ message: 'Book removed from shelf' });
  } catch (error) {
    next(error);
  }
});

// get all the shelves of a book
router.get('/:id/shelves', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const book: Book | null = await Book.findByPk(req.params.id, {
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

// get all the shelves with their books
router.get('/shelves-with-books', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shelves: Shelf[] = await Shelf.findAll({
      include: [{ model: Book, as: 'books' }]
    });
    res.status(200).json(shelves);
  } catch (error) {
    next(error);
  }
});

export default router;