import { world, Player, DisplaySlotId } from "@minecraft/server";

export function setupScoreboard(objectiveId: string, displayName: string) {
    try {
        let objective = world.scoreboard.getObjective(objectiveId);
        if (!objective) {
            objective = world.scoreboard.addObjective(objectiveId, displayName);
            world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
                objective: objective
            });
        }
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