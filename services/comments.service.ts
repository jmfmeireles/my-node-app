import { ObjectId } from "mongodb";
import db from "../config/mongo.ts";
import type { Comment } from "../models/movie.model.ts";

export const fetchAllComments = async (): Promise<Comment[]> => {
  return (await db?.collection("comments").find({}).toArray()) as Comment[];
};

export const fetchPaginatedComments = async (page: number, limit: number): Promise<Comment[]> => {
  const skip = (page - 1) * limit;
  return (await db?.collection("comments").find({}).skip(skip).limit(limit).toArray()) as Comment[];
};

export const fetchCommentById = async (id: string): Promise<Comment | null> => {
  return (await db?.collection("comments").findOne({ _id: new ObjectId(id) })) as Comment | null;
};

export const createComment = async (newComment: Comment): Promise<Comment | null> => {
  const result = await db?.collection("comments").insertOne({
    name: newComment.name,
    email: newComment.email,
    movie_id: newComment.movie_id,
    text: newComment.text,
    date: new Date().toISOString()
  });

  if (!result?.insertedId) throw new Error("Failed to create comment");
  return (await db?.collection("comments").findOne({ _id: result.insertedId })) as Comment | null;
};

export const updateComment = async (id: string, updatedData: Partial<Comment>): Promise<Comment | null> => {
  const result = await db?.collection("comments").updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
  if (result?.matchedCount === 0) return null;
  return (await db?.collection("comments").findOne({ _id: new ObjectId(id) })) as Comment | null;
};

export const deleteComment = async (id: string): Promise<string> => {
  const result = await db?.collection("comments").deleteOne({ _id: new ObjectId(id) });
  if (result?.deletedCount === 0) throw new Error("Comment not found");
  return "Comment deleted successfully";
};