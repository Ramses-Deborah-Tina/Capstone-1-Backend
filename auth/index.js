const express = require("express");
const { User } = require("../database");
const { generateToken, verifyToken } = require("./jwt");
const authenticateJWT = require("../auth/middleware");

const router = express.Router();

// Auth0 authentication
router.post("/auth0", async (req, res) => {
  try {
    const { auth0Id, email, username } = req.body;

    if (!auth0Id) return res.status(400).send({ error: "Auth0 ID is required" });

    let user = await User.findOne({ where: { auth0Id } });

    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.auth0Id = auth0Id;
        await user.save();
      }
    }

    if (!user) {
      const userData = {
        auth0Id,
        email: email || null,
        username: username || email?.split("@")[0] || `user_${Date.now()}`,
        passwordHash: null,
      };

      let finalUsername = userData.username;
      let counter = 1;
      while (await User.findOne({ where: { username: finalUsername } })) {
        finalUsername = `${userData.username}_${counter++}`;
      }
      userData.username = finalUsername;
      user = await User.create(userData);
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.send({
      message: "Auth0 authentication successful",
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Auth0 error:", error);
    res.sendStatus(500);
  }
});

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).send({ error: "Username and password are required" });

    if (password.length < 6)
      return res.status(400).send({ error: "Password must be at least 6 characters" });

    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(409).send({ error: "Username already exists" });

    const passwordHash = User.hashPassword(password);
    const user = await User.create({ username, passwordHash });

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.send({
      message: "Signup successful",
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.sendStatus(500);
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).send({ error: "Username and password are required" });

    const user = await User.findOne({ where: { username } });
    if (!user || !user.checkPassword(password)) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.send({
      message: "Login successful",
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.sendStatus(500);
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.send({ message: "Logout successful" });
});

// Get current user info (from token)
router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.send({});

  try {
    const user = verifyToken(token);
    res.send({ user });
  } catch {
    res.status(403).send({ error: "Invalid or expired token" });
  }
});

// Update user profile (protected)
router.put("/me", authenticateJWT, async (req, res) => {
  try {
    const { firstName, lastName, email, profilePicture } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).send({ error: "User not found" });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.send({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).send({ error: "Failed to update profile" });
  }
});

module.exports = router;

