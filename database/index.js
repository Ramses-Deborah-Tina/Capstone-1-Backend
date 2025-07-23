const db = require("./db");
const User = require("./user");
const Polls = require("./Polls");
const PollOption = require("./poll_options");
const Vote = require("./vote");
const Ballot = require("./ballot");

// USER ↔ POLLS
User.hasMany(Polls, { foreignKey: "user_id" });
Polls.belongsTo(User, { foreignKey: "user_id" });

// POLLS ↔ OPTIONS
Polls.hasMany(PollOption, {
  foreignKey: "pollId",
  as: "options",
  onDelete: "CASCADE",
});
PollOption.belongsTo(Polls, {
  foreignKey: "pollId",
  as: "poll",
});

// BALLOT ↔ VOTE
Ballot.hasMany(Vote, {
  foreignKey: "ballotId",
  as: "votes",
});
Vote.belongsTo(Ballot, {
  foreignKey: "ballotId",
  as: "ballot",
});

// BALLOT ↔ POLLS
Ballot.belongsTo(Polls, {
  foreignKey: "poll_id",
  as: "poll",
});

// BALLOT ↔ USER
Ballot.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// VOTE ↔ POLLOPTION
Vote.belongsTo(PollOption, {
  foreignKey: "pollOptionId",
  as: "option",
});
PollOption.hasMany(Vote, {
  foreignKey: "pollOptionId",
  as: "optionvotes",
});

module.exports = {
  db,
  User,
  Polls,
  PollOption,
  Ballot,
  Vote,
};

