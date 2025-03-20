import { world, DisplaySlotId, Player } from "@minecraft/server";

/**
 * Set up the scoreboard with the "score" objective for the given players.
 * @param players The players who are playing the game
 * @returns The created or existing score objective, or null if setup fails
 */
export function setupScoreboard(players: Player[]) {
  try {
    let scoreObjective = world.scoreboard.getObjective("score");
    if (!scoreObjective) {
      scoreObjective = world.scoreboard.addObjective("score", "Score");
    }

    // Set the scoreboard display for the sidebar
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective: scoreObjective });

    // Initialize scores for active players
    players.forEach((player) => {
      if (player && player.isValid()) {
        updatePlayerScore(player, 0); // Initialize score to 0
      }
    });

    return scoreObjective;
  } catch (error) {
    console.error("❌ Failed to set up the scoreboard:", error);
    return null;
  }
}

/**
 * Reset the scores of the given players to 0.
 * @param players The players whose scores should be reset
 */
export function resetPlayerScores(players: Player[]) {
  const scoreObjective = world.scoreboard.getObjective("score");
  if (scoreObjective) {
    players.forEach((player) => {
      if (player && player.isValid()) {
        updatePlayerScore(player, 0); // Reset score to 0
      }
    });
  }
}

/**
 * Update a player's score on the scoreboard.
 * @param player The player whose score should be updated
 * @param points The new score value
 */
export function updatePlayerScore(player: Player, points: number) {
  try {
    if (!player || !player.isValid()) throw new Error("Invalid player.");

    // Ensure the scoreboard exists (only run this once, not every time)
    try {
      world.getDimension("overworld").runCommand("scoreboard objectives add score dummy \"Player Score\"");
    } catch (e) {
      // Ignore if it already exists
    }

    // Update the player's score
    player.runCommandAsync(`scoreboard players set "${player.name}" score ${points}`);
  } catch (error) {
    console.error(`❌ Failed to update score for ${player.name}:`, error);
  }
}

/**
 * Clear the objectives from the scoreboard display and reset scores for the given players.
 * @param players The players whose scores should be cleared
 */
export function clearObjectives(players: Player[]) {
  try {
    // Clear the scoreboard display
    world.getDimension("overworld").runCommand("scoreboard objectives setdisplay sidebar");

    // Reset scores for the given players
    players.forEach((player) => {
      if (player && player.isValid()) {
        player.runCommandAsync(`scoreboard players reset "${player.name}" score`);
      }
    });
  } catch (error) {
    console.warn("⚠️ Error removing scoreboard display:", error);
  }
}