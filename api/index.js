const express = require("express");
const router = express.Router();

const testDbRouter = require("./test-db");
const usersRouter = require("./user");
const pollsRouter = require("./poll");
const ballotsRouter = require("./ballots");

router.use("/test-db", testDbRouter);
router.use("/users", usersRouter);
router.use("/polls", pollsRouter);
router.use("/ballots", ballotsRouter);

module.exports = router;
