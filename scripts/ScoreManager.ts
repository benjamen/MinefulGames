import { world, DisplaySlotId } from "@minecraft/server";

export function setupScoreboard(objectiveId: string, displayName: string) {
    try {
        // Remove existing objective if it exists
        try {
            world.scoreboard.removeObjective(objectiveId);
        } catch {} 
        
        // Create fresh objective and display it
        const objective = world.scoreboard.addObjective(objectiveId, displayName);
        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective });
        return objective;
    } catch (error) {
        console.error("Scoreboard setup failed:", error);
        return null;
    }
}

export function updatePlayerScore(player: any, objectiveId: string, points: number) {
    try {
        // Add to existing score instead of setting it
        player.runCommand(`scoreboard players add @s ${objectiveId} ${points}`);
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