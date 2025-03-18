import { world, system, DisplaySlotId, GameMode, MinecraftDimensionTypes } from "@minecraft/server";
export class GameSetup {
    constructor(gameName, gameDescription, timerMinutes, gameMode, // Restricted options for gameMode
    dayOrNight, difficulty) {
        this.gameTimer = 0; // Time in seconds
        this.overallScores = new Map(); // Stores cumulative scores
        this.gameName = gameName;
        this.gameDescription = gameDescription;
        this.gameTimer = timerMinutes * 60; // Convert minutes to seconds
        this.gameMode = gameMode; // Restricted to valid game modes
        this.dayOrNight = dayOrNight;
        this.difficulty = difficulty; // Restricted to valid difficulty levels
    }
    // Display game introduction and start timer
    startGame(players, gameArea) {
        // Clear previous game data (objectives, arena, and player inventories)
        this.clearObjectives();
        this.clearArena(gameArea);
        this.clearPlayerInventories(players);
        world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
        world.sendMessage(`${this.gameDescription}`);
        world.sendMessage(`⏳ You have ${this.gameTimer / 60} minutes! Good luck!`);
        // Set world settings for the game (Day/Night, Game Mode, Difficulty)
        this.setWorldSettings();
        // Teleport players to the game area and set the specified game mode
        players.forEach((player) => {
            player.teleport(gameArea);
            player.sendMessage(`🚀 Teleporting you to the game area!`);
            player.setGameMode(this.getGameModeEnum()); // Use the helper function to get the correct GameMode value
        });
        // Ensure the scoreboard is set up before the game starts
        this.setupScoreboard();
        // Reset points at the start of the game
        this.resetPlayerScores(players);
        // Start the game timer
        this.startTimer(players);
    }
    // Clear all scoreboard objectives
    clearObjectives() {
        world.scoreboard.getObjectives().forEach((objective) => {
            world.scoreboard.removeObjective(objective);
            world.sendMessage(`🧹 Removed scoreboard objective: ${objective.id}`);
        });
    }
    // Clear the arena by setting the specified area to air
    clearArena(gameArea) {
        const { x, y, z, dimension } = gameArea;
        const arenaSize = 20; // Example: Set arena size (adjust as needed)
        try {
            dimension.runCommand(`fill ${x - arenaSize} ${y} ${z - arenaSize} ${x + arenaSize} ${y + 10} ${z + arenaSize} air`);
            world.sendMessage(`🧹 Cleared the game arena!`);
        }
        catch (error) {
            world.sendMessage(`⚠️ Failed to clear arena: ${error}`);
        }
    }
    // Clear the inventories of all players
    clearPlayerInventories(players) {
        players.forEach((player) => {
            try {
                // Access the inventory component
                const inventory = player.getComponent("inventory");
                if (inventory && inventory.container) {
                    // Loop through all slots and clear them
                    for (let i = 0; i < inventory.container.size; i++) {
                        inventory.container.setItem(i, undefined); // Clear item in each slot
                    }
                    player.sendMessage(`🧹 Your inventory has been cleared!`);
                }
                else {
                    player.sendMessage("⚠️ Could not clear inventory. No inventory found.");
                }
            }
            catch (error) {
                world.sendMessage(`⚠️ Failed to clear inventory for player ${player.name}: ${error}`);
            }
        });
        world.sendMessage("🧹 Cleared all players' inventories!");
    }
    // Map the game mode string to the GameMode enum
    getGameModeEnum() {
        switch (this.gameMode) {
            case "survival":
                return GameMode.survival;
            case "creative":
                return GameMode.creative;
            case "adventure":
                return GameMode.adventure;
            case "spectator":
                return GameMode.spectator;
            default:
                throw new Error(`Invalid game mode: ${this.gameMode}`);
        }
    }
    // Set world settings for Game (Day/Night cycle, Game Mode, Difficulty)
    setWorldSettings() {
        // Set the time of day based on the parameter
        if (this.dayOrNight === "day") {
            world.getDimension(MinecraftDimensionTypes.overworld).runCommand("time set day"); // Set to day time
            world.getDimension(MinecraftDimensionTypes.overworld).runCommand("gamerule doDaylightCycle true"); // Enable daylight cycle
        }
        else {
            world.getDimension(MinecraftDimensionTypes.overworld).runCommand("time set night"); // Set to night time
            world.getDimension(MinecraftDimensionTypes.overworld).runCommand("gamerule doDaylightCycle false"); // Disable daylight cycle
        }
        // Set the world difficulty
        world.getDimension(MinecraftDimensionTypes.overworld).runCommand(`difficulty ${this.difficulty}`);
    }
    // Handle game timer countdown
    startTimer(players) {
        this.intervalId = system.runInterval(() => {
            if (this.gameTimer > 0) {
                this.gameTimer--;
                // Update action bar for players
                players.forEach((player) => {
                    player.onScreenDisplay.setActionBar(`⏳ Time Remaining: ${this.gameTimer} seconds`);
                });
            }
            else {
                // End the game when time is up
                this.endGame(players);
                if (this.intervalId) {
                    system.clearRun(this.intervalId);
                }
            }
        }, 20); // Run every second (20 ticks)
    }
    // End the game
    endGame(players) {
        world.sendMessage(`⏳ Time is up! The game ${this.gameName} is over!`);
        players.forEach((player) => {
            // Teleport players back to lobby
            player.teleport({ x: 0, y: 65, z: 0 }); // Adjust this to your lobby coordinates
            player.sendMessage(`🏠 Returning to the lobby!`);
        });
    }
    // Setup a scoreboard sidebar
    setupScoreboard() {
        const objective = world.scoreboard.addObjective("points", "Points");
        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
            objective,
        });
        return objective;
    }
    // Reset player scores before starting the game
    resetPlayerScores(players) {
        players.forEach((player) => {
            this.updatePlayerScore(player, 0); // Reset score to 0
        });
    }
    // Update points for a player
    updatePlayerScore(player, points) {
        const objective = world.scoreboard.getObjective("points");
        if (objective) {
            objective.setScore(player, points);
        }
    }
}
//# sourceMappingURL=gamesetup.js.map