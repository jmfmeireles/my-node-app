import type { Request, Response, NextFunction } from "express";
import * as AuthService from "../services/auth.service.ts";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AuthService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, username } = await AuthService.loginUser(req.body);
    req.session.regenerate((err: Error) => {
      if (err) throw err;
      req.session.user = username;
      res.status(200).json({ message });
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  AuthService.logoutUser(req.session, res, next);
};

export const protectedRoute = (req: Request, res: Response) => {
  res.status(200).json({
    message: `You have accessed a protected route with user ${req.session.user}`,
  });
};

// Google OAuth
export const authenticateGoogle = (req: Request, res: Response) => {
  const redirectUri = AuthService.getGoogleAuthUrl();
  res.cookie("state", redirectUri.state);
  res.redirect(redirectUri.url);
};

export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AuthService.handleGoogleCallback(
      req.query,
      req.cookies,
      req.session
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const protectedGoogle = (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.redirect("/authenticate");
  }
  res.status(200).json({
    message: `You have accessed a protected route with user ${req.session.user}`,
  });
};
