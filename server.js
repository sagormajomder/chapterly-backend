import cors from 'cors';
import express from 'express';
import { closeDB } from './src/config/db.js';
import {
  errorHandler,
  notFoundHandler,
} from './src/middlewares/error.middleware.js';
import bookRoutes from './src/routes/book.routes.js';
import commentRoutes from './src/routes/comment.routes.js';

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://chapterly-sm.web.app'],
    credentials: true,
  }),
);
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.status(200).send('<h1>Hello from Server</h1>');
});

// Mount Routes
app.use(bookRoutes);
app.use(commentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Crash / Unhandled Error Listeners
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (!process.env.VERCEL) process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception thrown:', err);
  if (!process.env.VERCEL) process.exit(1);
});

// Vercel serverless export
export default app;

// Local Development only: Bind port and handle terminal graceful shutdown (Ctrl + C)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  const handleLocalShutdown = async signal => {
    console.log(`Received ${signal}. Shutting down local server cleanly...`);
    await closeDB();
    process.exit(0);
  };

  process.on('SIGINT', () => handleLocalShutdown('SIGINT'));
  process.on('SIGTERM', () => handleLocalShutdown('SIGTERM'));
}
