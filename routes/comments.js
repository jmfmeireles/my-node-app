import express from 'express';
import { ObjectId } from 'mongodb';

import db from '../utils/mongoConnection.ts';


const router = express.Router();

// all comments
router.get('/', async (req, res, next) => {
  try {
    const comments = await db.collection('comments').find({}).toArray();
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
});

// get comments paginated
router.get('/paginated', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await db.collection('comments')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const comment = await db.collection('comments').findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(200).json(comment);
    
  } catch (error) {
    next(error);
  }
});

// Insert One
router.post('/', async (req, res, next) => {
  try {
    const newComment = req.body;
    const result = await db.collection('comments').insertOne({
      name: newComment.name,
      email: newComment.email,
      movie_id: newComment.movie_id,
      text: newComment.text,
      date: new Date().toISOString()
    });
    //get inserted comment by id
    const newCommentOnCollection = await db.collection('comments').findOne({ _id: result.insertedId });
    res.status(201).json(newCommentOnCollection);
  } catch (error) {
    next(error);
  }
});

//update comment by id
router.put('/:id', async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const updatedData = req.body;

    const result = await db.collection('comments').updateOne(
      { _id: new ObjectId(commentId) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    //get updated comment by id
    const updatedComment = await db.collection('comments').findOne({ _id: new ObjectId(commentId) });

    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
});

// delete comment by id
router.delete('/:id', async (req, res, next) => {
  try {
    const commentId = req.params.id;

    const result = await db.collection('comments').deleteOne({ _id: new ObjectId(commentId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;