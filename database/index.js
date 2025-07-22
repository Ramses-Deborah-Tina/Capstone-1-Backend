const db = require("./db");
const User = require("./user");
const Polls = require("./Polls");
const PollOption = require("./poll_options");


User.hasMany(Polls, { foreignKey: "user_id" });
Polls.belongsTo(User, { foreignKey: "user_id" });

Polls.hasMany(PollOption, { foreignKey: "pollId", onDelete: "CASCADE" });
PollOption.belongsTo(Polls, { foreignKey: "pollId" });

module.exports = {
  db,
  User,
  Polls,
  PollOption,
};
