const express = require("express");
const router = express.Router();

const authMiddleware = require("../auth/middleware");
const { Polls, PollOption } = require("../database");
const { tallyIRV } = require("./irv");

// Get all polls (protected)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const polls = await Polls.findAll();
    res.status(200).send(polls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch polls" });
  }
});

// Get a single poll by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const poll = await Polls.findByPk(req.params.id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) return res.status(404).send({ error: "Poll not found" });

    const now = new Date();
    if (poll.status === "published" && poll.endTime && new Date(poll.endTime) <= now) {
      poll.status = "ended";
      await poll.save();
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

    res.send({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      publishedAt: poll.publishedAt,
      endTime: poll.endTime,
      allowGuests: poll.allowGuests,
      options: poll.options,
      totalVotes,
    });
  } catch (err) {
    console.error("Error getting poll:", err);
    res.status(500).send({ error: "Server error" });
  }
});

// IRV Tally route
router.get("/:id/tally-irv", async (req, res) => {
  try {
    const winnerId = await tallyIRV(req.params.id);
    const winner = await PollOption.findByPk(winnerId);
    res.json({ winner });
  } catch (err) {
    console.error("IRV Tally Failed:", err);
    res.status(500).json({ error: "Failed to tally IRV votes" });
  }
});

// Update a poll (protected)
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const poll = await Polls.findByPk(req.params.id);

    if (!poll) return res.status(404).json({ error: "Poll not found" });

    if (["published", "ended"].includes(poll.status)) {
      return res.status(400).json({ error: "Cannot edit a published or ended poll" });
    }

    const { title, description } = req.body;
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }
    if (description !== undefined && !description.trim()) {
      return res.status(400).json({ error: "Description cannot be empty" });
    }

    const updatedPoll = await poll.update(req.body);
    res.send(updatedPoll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update poll" });
  }
});

// Create new poll (protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const createPoll = await Polls.create(req.body);
    res.status(201).send(createPoll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create poll" });
  }
});

// Delete a poll (protected)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletePoll = await Polls.findByPk(req.params.id);

    if (!deletePoll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (["published", "ended"].includes(deletePoll.status)) {
      return res.status(400).json({ error: "Cannot delete a published or ended poll" });
    }

    await deletePoll.destroy();
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete poll" });
  }
});

// Duplicate poll with options
router.post("/:id/duplicate", async (req, res) => {
  try {
    const originalPoll = await Polls.findByPk(req.params.id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!originalPoll) return res.status(404).json({ error: "Poll not found" });

    const duplicatedPoll = await Polls.create({
      user_id: originalPoll.user_id,
      title: originalPoll.title + " (Copy)",
      description: originalPoll.description,
      status: "draft",
    });

    const duplicatedOptions = await Promise.all(
      originalPoll.options.map((opt) =>
        PollOption.create({
          text: opt.text,
          votes: 0,
          pollId: duplicatedPoll.id,
        })
      )
    );

    res.status(201).json({
      message: "Poll duplicated successfully",
      poll: duplicatedPoll,
      options: duplicatedOptions,
    });
  } catch (err) {
    console.error("Duplicate poll error:", err);
    res.status(500).json({ error: "Failed to duplicate poll" });
  }
});

// Add option to poll
router.post("/:id/options", async (req, res) => {
  try {
    const { id: pollId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Option text is required." });
    }

    const poll = await Polls.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found." });
    }

    if (poll.status !== "draft") {
      return res.status(400).json({ error: "Cannot add options to a published or ended poll." });
    }

    const newOption = await PollOption.create({
      text,
      pollId: poll.id,
    });

    res.status(201).json({
      message: "Option added successfully.",
      option: newOption,
    });
  } catch (err) {
    console.error("Error adding poll option:", err);
    res.status(500).json({ error: "Failed to add option." });
  }
});

// Publish poll
router.put("/publish/:id", async (req, res) => {
  try {
    const poll = await Polls.findByPk(req.params.id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) return res.status(404).json({ error: "Poll not found" });
    if (poll.status !== "draft") return res.status(400).json({ error: "Only draft polls can be published" });

    if (!poll.title || !poll.description) {
      return res.status(400).json({ error: "Title and description are required to publish" });
    }

    if (!poll.options || poll.options.length < 2) {
      return res.status(400).json({ error: "Poll must have at least two options to publish" });
    }

    poll.status = "published";
    poll.publishedAt = new Date();
    await poll.save();

    res.send({ message: "Poll published successfully", poll });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ error: "Failed to publish poll" });
  }
});

// Manually end poll
router.put("/:id/end", async (req, res) => {
  try {
    const poll = await Polls.findByPk(req.params.id);

    if (!poll) return res.status(404).json({ error: "Poll not found" });
    if (poll.status !== "published") {
      return res.status(400).json({ error: "Only published polls can be ended" });
    }

    poll.status = "ended";
    await poll.save();

    res.json({ message: "Poll ended successfully", poll });
  } catch (error) {
    console.error("Error ending poll:", error);
    res.status(500).json({ error: "Failed to end poll" });
  }
});

module.exports = router;

