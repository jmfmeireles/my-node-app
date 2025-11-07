import type { ObjectId } from "mongodb";

// Define types for Movie and Comment
interface Movie {
  _id: ObjectId;
  title: string;
  comments?: Comment[];
  // not all fields shown
}

interface Comment {
  _id?: ObjectId;
  name: string;
  email: string;
  movie_id: string;
  text: string;
  date?: string;
}

export type { Movie, Comment };
