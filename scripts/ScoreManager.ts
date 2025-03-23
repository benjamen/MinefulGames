import { world, Player, DisplaySlotId, system } from "@minecraft/server";

export function setupScoreboard(objectiveId: string, displayName: string) {
    try {
        // Try to get the objective, or create it if it doesn't exist
        let objective = world.scoreboard.getObjective(objectiveId);
        if (!objective) {
            objective = world.scoreboard.addObjective(objectiveId, displayName);
        }
        
        // Set up the display slot with a longer delay to ensure it's ready
        system.runTimeout(() => {
            try {
                world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
                    objective: objective
                });
                world.sendMessage("§aScoreboard initialized!");
            } catch (error) {
                console.error("Failed to set display slot:", error);
            }
        }, 20); // 1-second delay
        
        return objective;
    } catch (error) {
        console.error("Scoreboard setup failed:", error);
        return null;
    }
}

export function updatePlayerScore(player: Player, objectiveId: string, score: number) {
    try {
        const objective = world.scoreboard.getObjective(objectiveId);
        if (objective) {
            objective.setScore(player, score);
        }
    } catch (error) {
        console.error("Score update failed:", error);
    }
}

export function clearPlayerScores(players: Player[]) {
    players.forEach(player => {
        try {
            player.runCommand(`scoreboard players reset @s`);
        } catch (error) {
            console.error("Score reset failed:", error);
        }
    });
}