const express = require("express");
const router = express.Router();
const { Ballot, Vote, Polls, PollOption, User } = require("../database");

router.post("/", async (req, res) => {
  try {
    const { pollId, userId, votes } = req.body;

    if (!pollId || !votes || votes.length < 2) {
      return res.status(400).json({ error: "Poll ID and at least 2 ranked votes are required." });
    }

    const poll = await Polls.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found." });
    }

    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const existingBallot = await Ballot.findOne({ where: { poll_id: pollId, user_id: userId } });
      if (existingBallot) {
        return res.status(400).json({ error: "User has already submitted a ballot for this poll." });
      }
    }

    // Create the ballot
    const ballot = await Ballot.create({
      poll_id: pollId,
      user_id: userId || null,
    });

    // Create the ranked votes
    const voteEntries = votes.map((optionId, index) => ({
      ballot_id: ballot.id,
      poll_option_id: optionId,
      rank: index + 1,
    }));

    await Vote.bulkCreate(voteEntries);

    res.status(201).json({ message: "Ballot submitted successfully", ballotId: ballot.id });
  } catch (err) {
    console.error("Error submitting ballot:", err);
    res.status(500).json({ error: "Failed to submit ballot." });
  }
});

module.exports = router;
