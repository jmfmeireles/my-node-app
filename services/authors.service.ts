import sequelize from "../config/db.ts";
import { Author, type CreateUpdateAuthorAttributes } from "../models/author.model.ts";
import { Profile } from "../models/profile.model.ts";
import { Book } from "../models/book.model.ts";
import { Sequelize } from "sequelize";

export const createAuthor = async (data: CreateUpdateAuthorAttributes) => {
  const t = await sequelize.transaction();
  try {
    const { biography, ...authorData } = data;
    const newAuthor = await Author.create(authorData, { transaction: t });
    let newProfile = null;
    if (biography) {
      newProfile = await Profile.create({ biography, authorId: newAuthor.id }, { transaction: t });
    }
    await t.commit();
    return { ...newAuthor.toJSON(), profile: newProfile ? newProfile.toJSON() : null };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const fetchAllAuthors = async () => {
  return await Author.findAll({});
};

export const fetchAuthorById = async (id: string) => {
  return await Author.findByPk(id, {
    attributes: [
      "firstName",
      "lastName",
      "fullName",
      "dateOfBirth",
      "age",
      "email",
      [Sequelize.col("profile.biography"), "biography"]
    ],
    include: [
      { model: Book, as: "books", attributes: ["title", "publicationYear"] },
      { model: Profile, as: "profile", attributes: [] }
    ]
  });
};

export const updateAuthor = async (id: string, data: CreateUpdateAuthorAttributes) => {
  const t = await sequelize.transaction();
  try {
    const author = await Author.findByPk(id);
    if (!author) return null;

    const { firstName, lastName, dateOfBirth, email, biography } = data;
    await author.update({ firstName, lastName, dateOfBirth, email }, { transaction: t });

    if (biography) {
      const profile = await Profile.findOne({ where: { authorId: author.id } });
      if (profile) {
        await profile.update({ biography }, { transaction: t });
      }
    }

    await t.commit();
    return author;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteAuthor = async (id: string) => {
  const t = await sequelize.transaction();
  try {
    const author = await Author.findByPk(id, { include: [{ model: Book, as: "books" }], transaction: t });
    if (!author) {
      await t.rollback();
      return null;
    }

    await author.destroy({ transaction: t });
    if (author.books) {
      for (const book of author.books) {
        await book.destroy({ transaction: t });
      }
    }

    await t.commit();
    return "Author and related books deleted successfully";
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const restoreAuthor = async (id: string) => {
  const t = await sequelize.transaction();
  try {
    const author = await Author.findByPk(id, {
      paranoid: false,
      include: [{ model: Book, as: "books", paranoid: false }],
      transaction: t
    });

    if (!author) {
      await t.rollback();
      return null;
    }

    await author.restore({ transaction: t });
    if (author.books) {
      for (const book of author.books) {
        await book.restore({ transaction: t });
      }
    }

    await t.commit();
    return "Author and related books restored successfully";
  } catch (error) {
    await t.rollback();
    throw error;
  }
};