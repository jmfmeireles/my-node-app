import { ObjectId } from "mongodb";
import db from "../config/mongo.ts";
import type { Movie, Comment } from "../models/movie.model.ts";

export const fetchAllMovies = async (): Promise<Movie[]> => {
  return (await db?.collection("movies").find({}).toArray()) as Movie[];
};

export const fetchPaginatedMovies = async (page: number, limit: number): Promise<Movie[]> => {
  const skip = (page - 1) * limit;
  return (await db?.collection("movies").find({}).skip(skip).limit(limit).toArray()) as Movie[];
};

export const fetchMovieById = async (id: string, includeComments: boolean): Promise<Movie | null> => {
  const movie = (await db?.collection("movies").findOne({ _id: new ObjectId(id) })) as Movie | null;
  if (!movie) return null;

  if (includeComments) {
    const comments: Comment[] = (await db?.collection("comments").find({ movie_id: new ObjectId(id) }).toArray()) as Comment[];
    movie.comments = comments;
  }

  return movie;
};

export const createMovie = async (newMovie: Movie): Promise<Movie | null> => {
  const result = await db?.collection("movies").insertOne(newMovie);
  if (!result?.insertedId) throw new Error("Failed to create movie");
  return (await db?.collection("movies").findOne({ _id: result.insertedId })) as Movie | null;
};

export const updateMovie = async (id: string, updatedData: Partial<Movie>): Promise<Movie | null> => {
  const result = await db?.collection("movies").updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
  if (result?.matchedCount === 0) return null;
  return (await db?.collection("movies").findOne({ _id: new ObjectId(id) })) as Movie | null;
};

export const deleteMovie = async (id: string): Promise<string> => {
  const result = await db?.collection("movies").deleteOne({ _id: new ObjectId(id) });
  if (result?.deletedCount === 0) throw new Error("Movie not found");

  const deleteResult = await db?.collection("comments").deleteMany({ movie_id: new ObjectId(id) });
  const deletedCount = deleteResult?.deletedCount ?? 0;

  let message = "Movie deleted.";
  if (deletedCount > 0) message += ` Also deleted ${deletedCount} associated comment(s).`;
  return message;
};