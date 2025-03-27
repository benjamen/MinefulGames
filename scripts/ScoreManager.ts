import { world, DisplaySlotId, Player } from "@minecraft/server";

export function updatePlayerScore(player: Player, objectiveId: string, value: number) {
  try {
    const objective = world.scoreboard.getObjective(objectiveId);
    if (objective) {
      objective.setScore(player.name, value);
    }
  } catch (error) {
    console.error("Score update failed:", error);
  }
}

export function setupScoreboard(objectiveId: string, displayName: string) {
  try {
    // Remove existing objective if it exists
    if (world.scoreboard.getObjective(objectiveId)) {
      world.scoreboard.removeObjective(objectiveId);
    }
    
    // Create new objective
    const objective = world.scoreboard.addObjective(objectiveId, displayName);
    
    // Set objective at sidebar display slot
    world.scoreboard.setObjectiveAtDisplaySlot(
      DisplaySlotId.Sidebar, 
      { objective, sortOrder: 1 }
    );
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