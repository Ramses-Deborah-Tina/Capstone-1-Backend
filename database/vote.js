const { DataTypes } = require("sequelize");
const db = require("./db");
const PollOption = require("./poll_options");

const Vote = db.define("vote", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ballot_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ballots", key: "id" },
  },
  poll_option_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "poll_options", key: "id" },
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true, 
  },
});

Vote.belongsTo(PollOption, {foreignKey: "poll_option_id"});
PollOption.hasMany(Vote, {foreignKey: "poll_option_id"});

module.exports = Vote;
