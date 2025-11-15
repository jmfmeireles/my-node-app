import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import sequelize from "./config/db.ts";
import commentsRouter from "./routes/comments.route.ts";
import moviesRouter from "./routes/movies.route.ts";
import authorsRouter from "./routes/authors.route.ts";
import booksRouter from "./routes/books.route.ts";
import authRouter from "./routes/auth.route.ts";
import sseRouter from "./routes/sse.route.ts";
import { errorMiddleware } from "./middlewares/error.middleware.ts";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET_KEY as string,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

app.use("/comments", commentsRouter);
app.use("/movies", moviesRouter);
app.use("/authors", authorsRouter);
app.use("/books", booksRouter);
app.use("/auth", authRouter);
app.use("/sse", sseRouter);

// Serve static demo page
app.use(express.static("public"));

app.use(errorMiddleware);

sequelize
  .sync({ force: true })
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((error) => console.error("Unable to start the server:", error));
