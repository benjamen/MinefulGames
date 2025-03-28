import { world, DisplaySlotId, Player, ObjectiveSortOrder } from "@minecraft/server";

export function setupScoreboard(objectiveId: string, displayName: string): boolean {
  // ... existing implementation ...

  try {
    let objective = world.scoreboard.getObjective(objectiveId);

    if (!objective) {
      objective = world.scoreboard.addObjective(objectiveId, displayName);
    }

    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
      objective: objective,
      sortOrder: ObjectiveSortOrder.Descending
    });

    

    return true;
  } catch (error) {
    console.error("Scoreboard setup failed:", error);
    return false;
  }
}

export function updatePlayerScore(player: Player, objectiveId: string, score: number) {
  try {
    const objective = world.scoreboard.getObjective(objectiveId);
    if (!objective) return;

    // Use the Player object directly instead of player.name
    objective.setScore(player, score);
  } catch (error) {
    console.error("Score update failed:", error);
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
