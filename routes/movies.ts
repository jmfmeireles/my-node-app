import express, { type Request, type Response, type NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import db from '../utils/mongoConnection.ts';
import type { Movie, Comment } from '../models/movies.ts';

const router = express.Router();

// all movies
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movies: Movie[] = await db.collection('movies').find({}).toArray() as Movie[];
    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
});

// paginated movies
router.get('/paginated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const movies: Movie[] = await db.collection('movies')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray() as Movie[];

    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
});

// get movie by id, with or without comments
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movieId = req.params.id;
    const includeComments = req.query.includeComments === 'true';

    const movie: Movie | null = await db.collection('movies').findOne({ _id: new ObjectId(movieId) }) as Movie | null;

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    if (includeComments) {
      const comments: Comment[] = await db
        .collection("comments")
        .find({ movie_id: new ObjectId(movieId) })
        .toArray() as Comment[];
      movie.comments = comments;
    }
    
    res.status(200).json(movie);
  } catch (error) {
    next(error);
  }
});

// create movie
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newMovie: Movie = req.body;
    const result = await db.collection('movies').insertOne(newMovie);
    const createdMovie: Movie | null = await db.collection('movies').findOne({ _id: result.insertedId }) as Movie | null;
    res.status(201).json(createdMovie);
  } catch (error) {
    next(error);
  }
});

// update movie
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movieId = req.params.id;
    const updatedData: Partial<Movie> = req.body;

    const result = await db.collection('movies').updateOne(
      { _id: new ObjectId(movieId) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const updatedMovie: Movie | null = await db.collection('movies').findOne({ _id: new ObjectId(movieId) }) as Movie | null;
    res.status(200).json(updatedMovie);
  } catch (error) {
    next(error);
  }
});

// delete movie and its comments
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movieId = req.params.id;

    const result = await db.collection('movies').deleteOne({ _id: new ObjectId(movieId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const deleteResult = await db.collection('comments').deleteMany({ movie_id: new ObjectId(movieId) });
    const deletedCount = deleteResult.deletedCount;

    let message = 'Movie deleted.';
    if (deletedCount > 0) {
      message += ` Also deleted ${deletedCount} associated comment(s).`;
    }
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
});

export default router;