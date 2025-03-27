import { world, DisplaySlotId, Player } from "@minecraft/server";


// In ScoreManager.ts - Update updatePlayerScore()
// In ScoreManager.ts
export function updatePlayerScore(player: Player, objectiveId: string, value: number) {
  try {
      player.runCommand(`scoreboard players set @s ${objectiveId} ${value}`);
  } catch (error) {
      console.error("Score update failed:", error);
  }
}

export function setupScoreboard(objectiveId: string, displayName: string) {
  try {
      world.scoreboard.removeObjective(objectiveId);
      world.scoreboard.addObjective(objectiveId, displayName);
      world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
          objective: world.scoreboard.getObjective(objectiveId)!,
          sortOrder: 1
      });
  } catch (error) {
      console.error("Scoreboard setup failed:", error);
  }
}


export function resetScoreboard(objectiveId: string) {
  try {
    world.scoreboard.removeObjective(objectiveId);
    world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
  } catch (error) {
    console.error("Scoreboard reset failed:", error);
  }
}