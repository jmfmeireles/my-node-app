import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { Sequelize } from "sequelize";
import sequelize from "../utils/dbConnection.ts";
import {
  Author,
  Book,
  Profile,
  type CreateUpdateAuthorAttributes,
} from "../models/sqlTablesModels.ts";

const router = express.Router();

// Create an author and related profile
router.post(
  "/",
  async (
    req: Request<{}, {}, CreateUpdateAuthorAttributes>,
    res: Response,
    next: NextFunction
  ) => {
    const t = await sequelize.transaction();
    try {
      const { biography, ...authorData } = req.body;
      const newAuthor: Author = await Author.create(authorData, { transaction: t });
      let newProfile;
      if (biography) {
        newProfile = await Profile.create(
          { biography, authorId: newAuthor.id },
          { transaction: t }
        );
      }
      await t.commit();
      res
        .status(200)
        .json({
          ...newAuthor.toJSON(),
          profile: newProfile ? newProfile.toJSON() : null,
        });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }
);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all authors
    const authors: Author[] = await Author.findAll({});
    res.status(200).json(authors);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get a single author
    const author: Author | null = await Author.findByPk(req.params.id, {
      attributes: [
        "firstName",
        "lastName",
        "fullName",
        "dateOfBirth",
        "age",
        "email",
        [Sequelize.col("profile.biography"), "biography"],
      ],
      include: [
        {
          model: Book,
          as: "books",
          attributes: ["title", "publicationYear"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: [],
        },
      ],
    });

    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.status(200).json(author);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  async (
    req: Request<{ id: string }, {}, CreateUpdateAuthorAttributes>,
    res: Response,
    next: NextFunction
  ) => {
    const t = await sequelize.transaction();
    try {
      // Update an author and related profile
      const author: Author | null = await Author.findByPk(req.params.id);
      const { firstName, lastName, dateOfBirth, email, biography } = req.body;

      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }

      await author.update(
        { firstName, lastName, dateOfBirth, email },
        { transaction: t }
      );
      if (!biography) {
        await t.commit();
        return res.status(200).json(author);
      }
      const profile: Profile | null = await Profile.findOne({ where: { authorId: author.id } });
      if (profile) {
        await profile.update({ biography }, { transaction: t });
      }
      await t.commit();

      res.status(200).json(author);
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }
);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      // Delete an author and related books
      const author: Author | null = await Author.findByPk(req.params.id, {
        include: [{ model: Book, as: "books", foreignKey: "authorId" }],
        transaction: t,
      });

      if (!author) {
        await t.rollback();
        return res.status(404).json({ error: "Author not found" });
      }

      await author.destroy({ transaction: t });

      // Soft delete related books
      if (author.books) {
        for (const book of author.books) {
          await book.destroy({ transaction: t });
        }
      }
      await t.commit();
      res
        .status(200)
        .json({ message: "Author and related books deleted successfully" });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }
);

// Restore soft-deleted author and related books
router.post(
  "/:id/restore",
  async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      const author: Author | null = await Author.findByPk(req.params.id, {
        paranoid: false,
        include: [{ model: Book, as: "books", paranoid: false }],
        transaction: t,
      });

      if (!author) {
        await t.rollback();
        return res.status(404).json({ error: "Author not found" });
      }

      await author.restore(({ transaction: t }));

      if (author.books) {
        for (const book of author.books) {
          await book.restore(({ transaction: t }) );
        }
      }

      await t.commit();

      res
        .status(200)
        .json({ message: "Author and related books restored successfully" });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }
);

export default router;
