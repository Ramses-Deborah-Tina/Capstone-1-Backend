const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
// const usersRouter = require("./user");
const pollsRouter = require("./poll");
router.use("/Polls", pollsRouter);
const ballotRouter = require("./ballots");
router.use("./ballots", ballotRouter);

router.use("/test-db", testDbRouter);

module.exports = router;
