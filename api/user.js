const express = require("express");
const router = express.Router();
const { User } = require("../database");

// Example: GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ["id", "username", "email"] });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Add more user routes as needed

module.exports = router;

/// this will be basic just to help test and fix issues
