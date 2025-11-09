import type { Request, Response, NextFunction } from "express";

export const authenticationSession = (req: Request, res: Response, next: NextFunction) => {
    debugger;
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};