import cors from 'cors';
import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';

const port = process.env.PORT || 5000;
const app = express();

// MiddleWare
app.use(cors());
app.use(express.json());

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

    // Get all books
    app.get('/all-books', async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const books = await booksCollection.find(query).toArray();
      res.status(200).send(books);
    });

    // get latest books
    app.get('/latest-books', async (req, res) => {
      const books = await booksCollection
        .find()
        .toArray()
        .sort({ created_at: 'desc' })
        .limit(6);
    });

    // post books
    app.post('/add-book', async (req, res) => {
      const newBook = req.body;
      console.log(newBook);

      const book = await booksCollection.insertOne(newBook);

      res.status(201).send(book);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
