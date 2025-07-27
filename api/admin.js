const express = require('express');
const router = express.Router();
const { User, Poll } = require('../../models');

// GET /api/admin/overview
router.get('/overview', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const bannedUsers = await User.count({ where: { status: 'banned' } });
    const totalPolls = await Poll.count();
    const frozenPolls = await Poll.count({ where: { status: 'frozen' } });

    res.json({
      totalUsers,
      bannedUsers,
      totalPolls,
      frozenPolls,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load overview data' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'status'],
      include: [{
        model: Poll,
        attributes: ['id'],
      }],
    });

    const result = users.map((user) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      polls: user.Polls.length,
      progress: Math.floor(Math.random() * 100), // Or calculate something real
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
