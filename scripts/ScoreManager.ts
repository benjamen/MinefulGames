import { world, DisplaySlotId, Player } from "@minecraft/server";

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

export function resetPlayerScores(players: Player[]) {
  const scoreObjective = world.scoreboard.getObjective("score");
  if (scoreObjective) {
    players.forEach((player) => updatePlayerScore(player, 0));
  }
}

export function updatePlayerScore(player: Player, points: number) {
  try {
    if (!player || !player.name) throw new Error("Invalid player or player name.");
    player.runCommandAsync(`scoreboard players set "${player.name}" score ${points}`);
  } catch (error) {
    console.error(`❌ Failed to update score for ${player.name}:`, error);
  }
}

export function clearObjectives() {
  try {
    const scoreObjective = world.scoreboard.getObjective("score");
    if (scoreObjective) {
      world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
    }
  } catch (error) {
    console.warn("⚠️ Error removing scoreboard display: " + error);
  }
}
