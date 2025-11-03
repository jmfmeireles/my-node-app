import express from 'express';
import { Sequelize } from 'sequelize';
import sequelize from '../utils/dbConnection.js';

import { Author, Book, Profile } from "../models/sqlTablesModels.js";

const router = express.Router();

// Create an author and related profile
router.post('/', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {biography, ...authorData} = req.body;
    const newAuthor = await Author.create(authorData, { transaction: t });
    const newProfile = await Profile.create({ biography, authorId: newAuthor.id }, { transaction: t });
    await t.commit();
    res.status(200).json({ ...newAuthor.toJSON(), profile: newProfile.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
  // Get all authors
  const authors = await Author.findAll({
    paranoid: false,
  });
  res.status(200).json(authors);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
  // Get a single author
  const author = await Author.findByPk(req.params.id, {
    attributes: ["firstName", "lastName", "fullName", "dateOfBirth", "age", "email", [Sequelize.col('profile.biography'), 'biography']],
    include: [{
      model: Book,
      as: 'books',
      attributes: ["title", "publicationYear"]
    },{
      model: Profile,
      as: 'profile',
      attributes: []
    }],
  });

  if(!author){
    return res.status(404).json({ error: 'Author not found'});
  }
  res.status(200).json(author);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
  // Update an author and related profile
  const author = await Author.findByPk(req.params.id);
  const { firstName, lastName, dateOfBirth, email} = req.body;
  
  if(!author){
    return res.status(404).json({ error: 'Author not found'});
  }

  await author.update({firstName, lastName, dateOfBirth, email});
  res.status(200).json(author);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
  // Delete an author
  const author = await Author.findByPk(req.params.id, {
    include: [
      { model: Book, as: 'books' }
    ]
  });

  if(!author){
    return res.status(404).json({error: 'Author not found'});
  }

  await author.destroy();
  res.status(200).json({ message: 'Author and related books deleted successfully' });
  } catch (error) {
    next(error);
  }
});

//restore soft-deleted author and related books
router.post('/:id/restore', async (req, res, next) => {
  try {
    const author = await Author.findByPk(req.params.id, {
      paranoid: false,
      include: [
        { model: Book, as: 'books', paranoid: false }
      ]
    });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    await author.restore();

    for (const book of author.books) {
      await book.restore();
    }

    res.status(200).json({ message: 'Author and related books restored successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;