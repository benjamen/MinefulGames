import { world, system, DisplaySlotId, GameMode, MinecraftDimensionTypes, } from "@minecraft/server";
import { setupArena, clearArena, clearChunk, teleportPlayersToArena } from "./arenaUtils";
export class GameSetup {
    constructor(gameName, gameDescription, timerMinutes, gameMode, dayOrNight, difficulty, lobbyLocation, arenaLocation, arenaSize, arenaCenter, arenaLowerCorner) {
        this.gameTimer = 0;
        if (timerMinutes <= 0)
            throw new Error("Timer must be greater than 0.");
        this.gameName = gameName;
        this.gameDescription = gameDescription;
        this.gameTimer = timerMinutes * 60;
        this.gameMode = gameMode;
        this.dayOrNight = dayOrNight;
        this.difficulty = difficulty;
        this.lobbyLocation = lobbyLocation;
        this.arenaLocation = arenaLocation;
        this.arenaSize = arenaSize;
        this.arenaCenter = arenaCenter;
        this.arenaLowerCorner = arenaLowerCorner;
    }
    startGame(players) {
        this.initializeGame(players);
        this.startTimer(players);
    }
    initializeGame(players) {
        this.clearObjectives();
        clearArena(this.arenaLowerCorner, this.arenaSize);
        clearChunk(this.arenaLocation.x, this.arenaLocation.z);
        this.clearPlayerInventories(players);
        world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
        world.sendMessage(`${this.gameDescription}`);
        world.sendMessage(`⏳ You have ${this.gameTimer / 60} minutes! Good luck!`);
        this.setWorldSettings();
        setupArena(this.arenaLocation, this.arenaSize);
        teleportPlayersToArena(players, this.arenaCenter, this.arenaLowerCorner.dimension);
        const objective = this.setupScoreboard();
        if (objective)
            this.resetPlayerScores(players);
    }
    clearObjectives() {
        let scoreObjective = world.scoreboard.getObjective("score");
        if (scoreObjective) {
            world.scoreboard.removeObjective(scoreObjective);
            try {
                world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
            }
            catch (error) {
                console.warn("⚠️ Error removing scoreboard display: " + error);
            }
        }
    }
    clearPlayerInventories(players) {
        players.forEach((player) => {
            try {
                const inventory = player.getComponent("inventory");
                if (inventory && inventory.container) {
                    for (let i = 0; i < inventory.container.size; i++) {
                        inventory.container.setItem(i, undefined);
                    }
                }
            }
            catch (error) {
                console.warn(`⚠️ Failed to clear inventory for player ${player.name}: ${error}`);
            }
        });
    }
    setWorldSettings() {
        try {
            const timeSettings = { day: 6000, night: 18000 };
            // Ensure dayOrNight value is valid
            if (Object.keys(timeSettings).includes(this.dayOrNight)) {
                world.setTimeOfDay(timeSettings[this.dayOrNight]);
                // Handle the daylight cycle gamerule
                world.getDimension(MinecraftDimensionTypes.overworld)
                    .runCommand(`gamerule doDaylightCycle ${this.dayOrNight === "day" ? "true" : "false"}`);
            }
            else {
                console.warn(`Invalid dayOrNight value: "${this.dayOrNight}". Must be "day" or "night".`);
            }
        }
        catch (error) {
            console.error("Error setting world settings:", error);
        }
        // Set difficulty level
        world.getDimension(MinecraftDimensionTypes.overworld).runCommand(`difficulty ${this.difficulty}`);
    }
    startTimer(players) {
        this.intervalId = system.runInterval(() => {
            if (this.gameTimer > 0) {
                this.gameTimer--;
                players.forEach((player) => {
                    player.onScreenDisplay.setActionBar(`⏳ Time Remaining: ${this.gameTimer} seconds`);
                });
            }
            else {
                this.endGame(players);
                if (this.intervalId) {
                    system.clearRun(this.intervalId);
                }
            }
        }, 20);
    }
    endGame(players) {
        world.sendMessage(`⏳ Time is up! The game ${this.gameName} is over!`);
        players.forEach((player) => {
            player.teleport(this.lobbyLocation, { dimension: world.getDimension(MinecraftDimensionTypes.overworld) });
            player.setGameMode(GameMode.creative);
        });
    }
    setupScoreboard() {
        try {
            let scoreObjective = world.scoreboard.getObjective("score");
            if (!scoreObjective) {
                scoreObjective = world.scoreboard.addObjective("score", "Score");
            }
            world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective: scoreObjective });
            return scoreObjective;
        }
        catch (error) {
            console.error("❌ Failed to set up the scoreboard:", error);
            return null;
        }
    }
    updatePlayerScore(player, points) {
        try {
            if (!player || !player.name)
                throw new Error("Invalid player or player name.");
            player.runCommandAsync(`scoreboard players set "${player.name}" score ${points}`);
        }
        catch (error) {
            console.error(`❌ Failed to update score for ${player.name}:`, error);
        }
    }
    resetPlayerScores(players) {
        try {
            let scoreObjective = world.scoreboard.getObjective("score");
            if (scoreObjective) {
                players.forEach((player) => {
                    player.runCommandAsync(`scoreboard players set "${player.name}" score 0`);
                });
            }
        }
        catch (error) {
            console.error("❌ Failed to reset player scores:", error);
        }
    }
}
//# sourceMappingURL=gamesetup.js.map