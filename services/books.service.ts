import sequelize from "../config/db.ts";
import { Author } from "../models/author.model.ts";
import { Book, type CreateUpdateBookAttributes } from "../models/book.model.ts";
import { Shelf } from "../models/shelf.model.ts";

export const createBook = async (data: CreateUpdateBookAttributes) => {
  const t = await sequelize.transaction();
  try {
    const { shelfIds, ...bookData } = data;

    const author = await Author.findByPk(bookData.authorId, { transaction: t });
    if (!author) {
      await t.rollback();
      throw new Error("Author not found");
    }

    const book = await Book.create(bookData, { transaction: t });

    if (shelfIds && shelfIds.length > 0) {
      const shelves = (
        await Promise.all(shelfIds.map((id) => Shelf.findByPk(id, { transaction: t })))
      ).filter((shelf): shelf is Shelf => shelf !== null);

      if (shelves.length !== shelfIds.length) {
        await t.rollback();
        throw new Error("One or more shelves not found");
      }

      await book.addShelves(shelves, { transaction: t });
    }

    await t.commit();
    return await Book.findByPk(book.id, { include: [{ model: Shelf, as: "shelves" }] });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const fetchAllBooks = async () => {
  return await Book.findAll({ include: [{ model: Shelf, as: "shelves" }] });
};

export const fetchShelvesWithBooks = async () => {
  return await Shelf.findAll({ include: [{ model: Book, as: "books" }] });
};

export const fetchBookById = async (id: string) => {
  return await Book.findByPk(id, { include: [{ model: Shelf, as: "shelves" }] });
};

export const updateBook = async (id: string, data: CreateUpdateBookAttributes) => {
  const t = await sequelize.transaction();
  try {
    const { shelfIds, ...bookData } = data;
    const book = await Book.findByPk(id, { transaction: t });
    if (!book) return null;

    const author = await Author.findByPk(bookData.authorId, { transaction: t });
    if (!author) {
      await t.rollback();
      throw new Error("Author not found");
    }

    await book.update(bookData, { transaction: t });

    if (shelfIds) {
      const shelves = (
        await Promise.all(shelfIds.map((id) => Shelf.findByPk(id, { transaction: t })))
      ).filter((shelf): shelf is Shelf => shelf !== null);

      if (shelves.length !== shelfIds.length) {
        await t.rollback();
        throw new Error("One or more shelves not found");
      }

      await book.setShelves(shelves, { transaction: t });
    }

    await t.commit();
    return await Book.findByPk(book.id, { include: [{ model: Shelf, as: "shelves" }] });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteBook = async (id: string) => {
  const book = await Book.findByPk(id);
  if (!book) throw new Error("Book not found");
  await book.destroy();
  return "Book deleted";
};

export const removeBookFromShelf = async (bookId: string, shelfId: string) => {
  const book = await Book.findByPk(bookId);
  const shelf = await Shelf.findByPk(shelfId);

  if (!book || !shelf) throw new Error("Book or Shelf not found");
  if (!(await book.hasShelf(shelf))) throw new Error("Book is not on the specified shelf");

  await book.removeShelf(shelf);
  return "Book removed from shelf";
};

export const fetchBookShelves = async (id: string): Promise<Shelf[] | null | undefined> => {
  const book = await Book.findByPk(id, { include: [{ model: Shelf, as: "shelves" }] });
  return book ? book.shelves : null;
};
