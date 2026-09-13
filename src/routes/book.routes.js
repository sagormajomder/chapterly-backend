import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { booksCollection } from '../config/db.js';
import { verifyFireBaseToken } from '../middlewares/auth.middleware.js';

const router = Router();

//! Get all books
router.get('/all-books', async (req, res, next) => {
  try {
    const books = await booksCollection.find().toArray();
    res.status(200).send(books);
  } catch (err) {
    next(err);
  }
});

//! All books sorted by rating
router.get('/sort', async (req, res, next) => {
  try {
    const sortBy = req.query.sortby;
    const pipeline = [{ $sort: { rating: sortBy === 'low' ? 1 : -1 } }];
    const books = await booksCollection.aggregate(pipeline).toArray();
    res.status(200).send(books);
  } catch (err) {
    next(err);
  }
});

//! Get latest books
router.get('/latest-books', async (req, res, next) => {
  try {
    const books = await booksCollection
      .find()
      .sort({ created_at: 'desc' })
      .limit(6)
      .toArray();

    res.status(200).send(books);
  } catch (err) {
    next(err);
  }
});

//! Get single book details
router.get('/book-details/:id', verifyFireBaseToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid book ID format' });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });
    if (!book) {
      return res.status(404).send({ message: 'book not found' });
    }

    res.status(200).send(book);
  } catch (err) {
    next(err);
  }
});

//! Get specific user added books
router.get('/my-books', verifyFireBaseToken, async (req, res, next) => {
  try {
    const email = req.query.email;

    if (email) {
      if (email !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      const books = await booksCollection.find({ userEmail: email }).toArray();
      return res.status(200).send(books);
    }

    res
      .status(404)
      .send({ message: 'no user found to show his/her added books' });
  } catch (err) {
    next(err);
  }
});

//! Post a book
router.post('/add-book', verifyFireBaseToken, async (req, res, next) => {
  try {
    const newBook = { ...req.body, userEmail: req.token_email };

    if (newBook.rating !== undefined) {
      newBook.rating = Number(newBook.rating) || 0;
    }

    const result = await booksCollection.insertOne(newBook);
    res.status(201).send(result);
  } catch (err) {
    next(err);
  }
});

//! Update a book
router.patch(
  '/update-book/:id',
  verifyFireBaseToken,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid book ID format' });
      }

      const query = { _id: new ObjectId(id) };
      const book = await booksCollection.findOne(query);

      if (!book) {
        return res.status(404).send({ message: 'book not found' });
      }

      if (book.userEmail !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      const updatedBook = req.body;
      if (updatedBook.rating !== undefined) {
        updatedBook.rating = Number(updatedBook.rating) || 0;
      }

      // Remove immutable _id field to prevent Mongo update error
      delete updatedBook._id;

      const update = {
        $set: updatedBook,
      };

      const result = await booksCollection.updateOne(query, update);
      res.status(200).send(result);
    } catch (err) {
      next(err);
    }
  },
);

//! Delete a book
router.delete(
  '/delete-book/:id',
  verifyFireBaseToken,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid book ID format' });
      }

      const query = { _id: new ObjectId(id) };
      const book = await booksCollection.findOne(query);

      if (!book) {
        return res.status(404).send({ message: 'book not found' });
      }

      if (book.userEmail !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      const result = await booksCollection.deleteOne(query);
      res.status(200).send(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
