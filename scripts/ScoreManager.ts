import { world, DisplaySlotId, Player } from "@minecraft/server";

/**
 * Set up the scoreboard with the "score" objective.
 * @returns The created or existing score objective, or null if setup fails
 */
export function setupScoreboard() {
  try {
    let scoreObjective = world.scoreboard.getObjective("score");
    if (!scoreObjective) {
      scoreObjective = world.scoreboard.addObjective("score", "Score");
    }
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective: scoreObjective });
    return scoreObjective;
  } catch (error) {
    console.error("❌ Failed to set up the scoreboard:", error);
    return null;
  }
}

/**
 * Reset the scores of all players to 0.
 * @param players The players whose scores should be reset
 */
export function resetPlayerScores(players: Player[]) {
  const scoreObjective = world.scoreboard.getObjective("score");
  if (scoreObjective) {
    players.forEach((player) => updatePlayerScore(player, 0));
  }
}

/**
 * Update a player's score on the scoreboard.
 * @param player The player whose score should be updated
 * @param points The new score value
 */
export function updatePlayerScore(player: Player, points: number) {
  try {
    if (!player || !player.name) throw new Error("Invalid player or player name.");

    // Use a command to update the player's score
    player.runCommandAsync(`scoreboard players set "${player.name}" score ${points}`);
    console.warn(`✔️ Updated score for ${player.name} to ${points}.`);
  } catch (error) {
    console.error(`❌ Failed to update score for ${player.name}:`, error);
  }
}
/**
 * Clear the objectives from the scoreboard display.
 */

export function clearObjectives() {
  try {
    console.warn("Attempting to clear scoreboard display...");

    // Run a command to clear the scoreboard display
    world.getDimension("overworld").runCommand("scoreboard objectives setdisplay sidebar");
    console.warn("✔️ Cleared the scoreboard display using commands.");

    // Run a command to reset all player scores
    world.getDimension("overworld").runCommand("scoreboard players reset * score");
    console.warn("✔️ Removed all player entries using commands.");
  } catch (error) {
    console.warn("⚠️ Error removing scoreboard display:", error);
  }
}
