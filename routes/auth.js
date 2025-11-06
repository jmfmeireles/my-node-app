import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user.ts";
import crypto from "node:crypto";

const router = express.Router();

//register route
router.post("/register", async (req, res, next) => {
  try {
    // Registration logic here
    const { username, password } = req.body;
    //password must be at least 6 characters
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }
    //encrypt password
    const passwordEncrypted = await bcrypt.hash(password, 10);
    // Assume User is a Sequelize model
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

//login route
router.post("/login", async (req, res, next) => {
  try {
    // Login logic here
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username }, raw: true });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Password is wrong" });
    }

    req.session.regenerate((err) => {
      if (err) next(err);
      req.session.user = user.username;
      res.status(200).json({ message: "Login successful" });
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ["id", "username"] });
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid", { path: "/" });
    res.status(200).json({ message: "Logout successful" });
  });
});


const authenticationSession = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

router.get("/protected", authenticationSession, (req, res) => {
  if (!req.session.user) {
    //give user three options: /login, /register, /authenticate
    return res.status(401).json({
      error: "Unauthorized!",
    });
  }
  res.status(200).json({ message: `You have accessed a protected route with user ${req.session.user}` });
});

/***************************oauth 2 with google *****************************/

router.get("/authenticate", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=openid%20email%20profile&state=${state}`;
  res.cookie('state', state);
  res.redirect(redirectUri);
});

router.get("/callback", async (req, res, next) => {
  try {
    const { code, state: stateFromqQuery } = req.query;
    const stateFromCookie = req.cookies['state'];

    if (!stateFromCookie || stateFromCookie !== stateFromqQuery) {
      return res.status(401).json({ error: "Invalid state parameter" });
    }

    const body = new URLSearchParams({
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
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
    req.session.user = userInfo;
    res.status(200).json({ user: userInfo });

  } catch (error) {
    next(error);
  }
});

router.get("/protected-google", authenticationSession, (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect('/authenticate');
    }
    res.status(200).json({ message: `You have accessed a protected route with user ${req.session.user.name}` });
  } catch (error) {
    next(error);
  }
});

export default router;
