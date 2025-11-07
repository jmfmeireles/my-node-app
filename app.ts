import express, {type  Request, type Response, type NextFunction } from 'express';
import { ValidationError } from 'sequelize';
import sequelize from './utils/dbConnection.ts';
import commentsRouter from './routes/comments.ts';
import moviesRouter from './routes/movies.ts';
import authorsRouter from './routes/authors.ts';
import booksRouter from './routes/books.ts';
import authRouter from './routes/auth.ts';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SECRET_KEY as string,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use('/comments', commentsRouter);
app.use('/movies', moviesRouter);
app.use('/authors', authorsRouter);
app.use('/books', booksRouter);
app.use('/auth', authRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        message: "Validation error",
        details: err.errors.map(e => e.message)
      }
    });
  }

  // Handle generic 404 errors
  if (err.status === 404) {
    return res.status(404).json({
      error: {
        message: "Resource not found",
        details: err.message || null,
      },
    });
  }

  // Default to 500 Server Error for unhandled errors
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: err.details || null,
    },
  });
});

sequelize.sync({ force: true }).then(() => {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}).catch(error => console.error("Unable to start the server:", error));
