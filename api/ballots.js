const express = require("express");
const router = express.Router();
const { Ballot } = require("../database");
const { authMiddleware } = require("../auth/middleware");

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { pollId, selectedOption } = req.body;

    if (!pollId || !selectedOption) {
      return res.status(400).json({ error: "Missing pollId or selectedOption" });
    }

    const newBallot = await Ballot.create({
      pollId,
      selectedOption,
      userId: req.user.sub, 
    });

    res.status(201).json(newBallot);
  } catch (error) {
    console.error("Error submitting ballot:", error);
    res.status(500).json({ error: "Failed to submit ballot" });
  }
});

module.exports = router;


// This is a dummy ballot file only to test the middleware we can delete this if its of no use. 
