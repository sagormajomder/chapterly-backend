import cors from 'cors';
import express from 'express';
import admin from 'firebase-admin';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

const decoded = Buffer.from(
  process.env.FIREBASE_SERVICE_KEY,
  'base64'
).toString('utf8');
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const port = process.env.PORT || 5000;
const app = express();

// MiddleWare
app.use(cors());
app.use(express.json());

async function verifyFireBaseToken(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({
      message: 'unauthorized access',
    });
  }
  const token = authorization.split(' ')[1];

  if (!token) {
    return res.status(401).send({
      message: 'unauthorized access. Token not found!',
    });
  }

  try {
    const tokenInfo = await admin.auth().verifyIdToken(token);

    // console.log(tokenInfo);
    req.token_email = tokenInfo.email;

    next();
  } catch (error) {
    console.log('Invalid Token');
    console.log(error);
    res.status(401).send({
      message: 'unauthorized access.',
    });
  }
}

// Root Server Route
app.get('/', (req, res) => {
  res.status(200).send('<h1>Hello from Server</h1>');
});

//DB CONFIG
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qpprkks.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    // DB
    const chapterlyDB = client.db('chapterlyDB');
    const booksCollection = chapterlyDB.collection('books');
    const commentsCollection = chapterlyDB.collection('comments');

    //! Get all books
    app.get('/all-books', async (req, res) => {
      const books = await booksCollection.find().toArray();
      res.status(200).send(books);
    });

    //! all books sorted by rating
    app.get('/sort', async (req, res) => {
      const sortBy = req.query.sortby;

      const pipeline = [{ $sort: { rating: sortBy === 'low' ? 1 : -1 } }];

      try {
        const books = await booksCollection.aggregate(pipeline).toArray();
        return res.status(200).send(books);
      } catch (err) {
        console.error('Aggregation error', err);
        return res.status(500).send({ message: 'Aggregation failed' });
      }
    });

    //! get latest books
    app.get('/latest-books', async (req, res) => {
      const books = await booksCollection
        .find()
        .sort({ created_at: 'desc' })
        .limit(6)
        .toArray();

      res.status(200).send(books);
    });

    //! Get single book
    app.get('/book-details/:id', verifyFireBaseToken, async (req, res) => {
      const { id } = req.params;
      const book = await booksCollection.findOne({ _id: new ObjectId(id) });
      res.status(200).send(book);
    });

    //! Get specific user added books
    app.get('/my-books', verifyFireBaseToken, async (req, res) => {
      const email = req.query.email;

      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: 'forbidden access' });
        }

        const books = await booksCollection
          .find({ userEmail: email })
          .toArray();

        return res.status(200).send(books);
      }

      res
        .status(404)
        .send({ message: 'no user found to show his/her added books' });
    });

    //! post books
    app.post('/add-book', verifyFireBaseToken, async (req, res) => {
      const newBook = req.body;
      // console.log(req.headers);
      // console.log(newBook);

      const book = await booksCollection.insertOne(newBook);

      res.status(201).send(book);
    });

    // !update book
    app.patch('/update-book/:id', verifyFireBaseToken, async (req, res) => {
      const { id } = req.params;
      const updatedBook = req.body;
      const query = { _id: new ObjectId(id) };

      // check if the user is added the book
      const book = await booksCollection.findOne(query);
      if (book.userEmail !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      const update = {
        $set: updatedBook,
      };

      const result = await booksCollection.updateOne(query, update);

      res.status(200).send(result);
    });

    //! delete book
    app.delete('/delete-book/:id', verifyFireBaseToken, async (req, res) => {
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };

      // check if the user is permitted
      const book = await booksCollection.findOne(query);
      if (book.userEmail !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      const result = await booksCollection.deleteOne(query);

      res.status(200).send(result);
    });

    // ! Add comment

    app.post('/add-comment', (req, res) => {});
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
