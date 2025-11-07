import express, { type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcrypt";
import User, { type UserCreationAttributes } from "../models/user.model.ts";
import crypto from "node:crypto";

const router = express.Router();

// Register route
router.post("/register", async (req: Request<{}, {}, UserCreationAttributes>, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }
    const passwordEncrypted = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: passwordEncrypted,
    });
    res
      .status(201)
      .json({ message: "User registered successfully", userId: newUser.id });
  } catch (error) {
    next(error);
  }
});

// Login route
router.post("/login", async (req: Request<{}, {}, UserCreationAttributes>, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username }, raw: true });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Password is wrong" });
    }

    req.session.regenerate((err: Error) => {
      if (err) next(err);
      req.session.user = user.username;
      res.status(200).json({ message: "Login successful" });
    });
  } catch (error) {
    next(error);
  }
});

const authenticationSession = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Protected route
router.get("/protected", authenticationSession, (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({
      error: "Unauthorized!",
    });
  }
  res
    .status(200)
    .json({
      message: `You have accessed a protected route with user ${req.session.user}`,
    });
});

// Logout route
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err: Error) => {
    if (err) {
      return next(err);
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful" });
  });
});

/***************************oauth 2 with google *****************************/
router.get("/authenticate", (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=openid%20email%20profile&state=${state}`;
  res.cookie('state', state);
  res.redirect(redirectUri);
});

router.get("/callback", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state: stateFromqQuery } = req.query as { code?: string; state?: string };
    const stateFromCookie = req.cookies['state'];

    if (!stateFromCookie || stateFromCookie !== stateFromqQuery) {
      return res.status(401).json({ error: "Invalid state parameter" });
    }

    const body = new URLSearchParams({
      code: code!,
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      redirect_uri: process.env.REDIRECT_URI!,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (!tokenResponse.ok) {
      return res.status(500).json({ error: "Failed to fetch access token" });
    }

    const tokenData = await tokenResponse.json();
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return res.status(500).json({ error: "Failed to fetch user info" });
    }

    const userInfo = await userInfoResponse.json();
    req.session.user = userInfo.name;
    res.status(200).json({ user: userInfo });

  } catch (error) {
    next(error);
  }
});

router.get("/protected-google", authenticationSession, (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session.user) {
      return res.redirect('/authenticate');
    }
    res.status(200).json({ message: `You have accessed a protected route with user ${req.session.user}` });
  } catch (error) {
    next(error);
  }
});

export default router;
