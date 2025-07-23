const {Vote, PollOption} = require("../database");

const tallyIRV = async (pollId) => {
  const votes = await Vote.findAll({
    include: [{model: PollOption, where: {pollId}}],
    order: [["rank", "ASC"]],
  });

  const ballots = {};

  // Build the ballots: {ballotId: [optionId1, optionId2, etc etc]}
  votes.forEach((vote) => {
    const ballotId = vote.ballot_id;
    if (!ballots[ballotId]) ballots[ballotId] = [];
    ballots[ballotId][vote.rank - 1] = vote.poll_option_id;
  });

  // Get all option IDs
  let remaining = await PollOption.findAll({where: {pollId}});
  remaining = remaining.map((opt) => opt.id);

  while (true) {
    const tally = {};
    for (const optionId of remaining) tally[optionId] = 0;

    for (const ranks of Object.values(ballots)) {
      const firstChoice = ranks.find((id) => remaining.includes(id));
      if (firstChoice) tally[firstChoice]++;
    }

    const totalVotes = Object.values(tally).reduce((a, b) => a + b, 0);
    const winner = Object.entries(tally).find(([_, count]) => count > totalVotes / 2);
    if (winner) return parseInt(winner[0]);

    // Added in tie-breaker logic
    const minVotes = Math.min(...Object.values(tally));
    const tied = Object.entries(tally)
      .filter(([_, count]) => count === minVotes)
      .map(([id]) => parseInt(id));

    let eliminated;

    if (tied.length === 1) {
      eliminated = tied[0];
    } else {
      // We tie on first-choice votes then check second-choice counts
      const secondChoiceCounts = {};
      tied.forEach((id) => (secondChoiceCounts[id] = 0));

      Object.values(ballots).forEach((ranks) => {
        const next = ranks.find((id) => tied.includes(id));
        if (next) secondChoiceCounts[next]++;
      });

      const minSecond = Math.min(...Object.values(secondChoiceCounts));
      const secondTied = Object.entries(secondChoiceCounts)
        .filter(([_, count]) => count === minSecond)
        .map(([id]) => parseInt(id));

      // Fallback to lowest ID if still tied
      eliminated = Math.min(...secondTied);
    }

    remaining = remaining.filter((id) => id !== eliminated);

    if (remaining.length === 1) return remaining[0]; // Last one wins!
  }
};

module.exports = {tallyIRV};
