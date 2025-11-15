import * as bcrypt from "bcrypt";
import crypto from "node:crypto";

import User from "../models/user.model.ts";

export interface Credentials {
  username: string;
  password: string;
}

export const registerUser = async ({ username, password }: Credentials) => {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }
  const passwordEncrypted = await bcrypt.hash(password, 10);
  const newUser = await User.create({ username, password: passwordEncrypted });
  return { message: "User registered successfully", userId: newUser.id };
};

export const loginUser = async ({username, password}: Credentials) => {
  const user = await User.findOne({ where: { username }, raw: true });
  if (!user) throw new Error("User not found");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("Password is wrong");

  return { message: "Login successful", username: user.username };
};

export const logoutUser = (session: any, res: any, next: any) => {
  session.destroy((err: Error) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful" });
  });
};

// Google OAuth
export const getGoogleAuthUrl = () => {
  const state = crypto.randomBytes(16).toString("hex");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=openid%20email%20profile&state=${state}`;
  return { url, state };
};

export const handleGoogleCallback = async (query: any, cookies: any, session: any) => {
  const { code, state: stateFromQuery } = query;
  const stateFromCookie = cookies["state"];
  if (!stateFromCookie || stateFromCookie !== stateFromQuery) {
    throw new Error("Invalid state parameter");
  }

  const body = new URLSearchParams({
    code: code!,
    client_id: process.env.CLIENT_ID!,
    client_secret: process.env.CLIENT_SECRET!,
    redirect_uri: process.env.REDIRECT_URI!,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenResponse.ok) throw new Error("Failed to fetch access token");
  const tokenData = await tokenResponse.json();

  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userInfoResponse.ok) throw new Error("Failed to fetch user info");
  const userInfo = await userInfoResponse.json();

  session.user = userInfo.name;
  return { user: userInfo };
};