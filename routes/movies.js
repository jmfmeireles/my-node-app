import express from 'express';
import { ObjectId } from 'mongodb';

import db from '../utils/mongoConnection.js';


const router = express.Router();

// all movies
router.get('/', async (req, res, next) => {
  try {
    const movies = await db.collection('movies').find({}).toArray();
    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
});

// paginated movies
router.get('/paginated', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const movies = await db.collection('movies')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
});

// get movie by id, with or without comments
router.get('/:id', async (req, res, next) => {
  try {
    const movieId = req.params.id;
    const includeComments = req.query.includeComments === 'true';

    const movie = await db.collection('movies').findOne({ _id: new ObjectId(movieId) });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    if (includeComments) {
      const comments = await db
        .collection("comments")
        .find({ movie_id: new ObjectId(movieId) })
        .toArray();
      movie.comments = comments;
    }
    
    res.status(200).json(movie);
  } catch (error) {
    next(error);
  }
});

//create movie
router.post('/', async (req, res, next) => {
  try {
    const newMovie = req.body;
    //no schema validation for simplicity
    const result = await db.collection('movies').insertOne(newMovie);
    //get created movie
    const createdMovie = await db.collection('movies').findOne({ _id: result.insertedId });
    res.status(201).json(createdMovie);
  } catch (error) {
    next(error);
  }
});

//update movie
router.put('/:id', async (req, res, next) => {
  try {
    const movieId = req.params.id;
    const updatedData = req.body;

    const result = await db.collection('movies').updateOne(
      { _id: new ObjectId(movieId) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const updatedMovie = await db.collection('movies').findOne({ _id: new ObjectId(movieId) });
    res.status(200).json(updatedMovie);
  } catch (error) {
    next(error);
  }
});

//delete movie and its comments
router.delete('/:id', async (req, res, next) => {
  try {
    const movieId = req.params.id;

    const result = await db.collection('movies').deleteOne({ _id: new ObjectId(movieId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Delete associated comments
    await db.collection('comments').deleteMany({ movie_id: new ObjectId(movieId) });

    res.status(200).json({ message: 'Movie and associated comments deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;