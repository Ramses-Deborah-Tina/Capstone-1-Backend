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

    // Handle guest voting logic
    if (!userId) {
      if (!poll.allowGuests) {
        return res.status(403).json({ error: "This poll does not allow guest voting." });
      }
    } else {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const existingBallot = await Ballot.findOne({
        where: { poll_id: pollId, user_id: userId },
      });

      if (existingBallot) {
        return res.status(400).json({ error: "User has already submitted a ballot for this poll." });
      }
    }

    const ballot = await Ballot.create({
      poll_id: pollId,
      user_id: userId || null,
    });

    await Promise.all(
      votes.map((vote, index) =>
        Vote.create({
          ballot_id: ballot.id,
          poll_option_id: vote,
          rank: index + 1,
        })
      )
    );

    res.status(201).json({ message: "Ballot submitted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit ballot." });
  }
});

module.exports = router;
