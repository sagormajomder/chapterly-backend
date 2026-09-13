import { Router } from 'express';
import { commentsCollection } from '../config/db.js';
import { verifyFireBaseToken } from '../middlewares/auth.middleware.js';

const router = Router();

//! Add comment
router.post('/add-comment', verifyFireBaseToken, async (req, res, next) => {
  try {
    const newComment = req.body;
    const result = await commentsCollection.insertOne(newComment);
    res.status(201).send(result);
  } catch (err) {
    next(err);
  }
});

//! Get comments by book ID
router.get('/comments/:id', verifyFireBaseToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await commentsCollection
      .find({ bookID: id })
      .sort({ created_at: 'desc' })
      .toArray();

    res.status(200).send(comments);
  } catch (err) {
    next(err);
  }
});

export default router;
