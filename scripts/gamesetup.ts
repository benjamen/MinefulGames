import {
  world,
  system,
  DimensionLocation,
  DisplaySlotId,
  GameMode,
  MinecraftDimensionTypes,
  EntityInventoryComponent,
  Vector3,
} from "@minecraft/server";
import { setupArena } from "./arenaUtils";

export class GameSetup {
  private gameTimer: number = 0; // Time in seconds
  private intervalId: number | undefined;
  private gameName: string;
  private gameDescription: string;
  private overallScores: Map<string, number> = new Map(); // Stores cumulative scores
  private gameMode: "survival" | "creative" | "adventure" | "spectator";
  private dayOrNight: "day" | "night"; // Day or Night cycle
  private difficulty: "peaceful" | "easy" | "normal" | "hard"; // Difficulty setting

  constructor(
    gameName: string,
    gameDescription: string,
    timerMinutes: number,
    gameMode: "survival" | "creative" | "adventure" | "spectator", // Restricted options for gameMode
    dayOrNight: "day" | "night",
    difficulty: "peaceful" | "easy" | "normal" | "hard"
  ) {
    this.gameName = gameName;
    this.gameDescription = gameDescription;
    this.gameTimer = timerMinutes * 60; // Convert minutes to seconds
    this.gameMode = gameMode; // Restricted to valid game modes
    this.dayOrNight = dayOrNight;
    this.difficulty = difficulty; // Restricted to valid difficulty levels
  }

  // Display game introduction and start timer
  startGame(
    players: any[],
    gameArea: DimensionLocation,
    ARENA_VECTOR_OFFSET: Vector3,
    ARENA_SIZE: { x: number; y: number; z: number }
  ) {
    // Clear previous game data (objectives, arena, and player inventories)
    this.clearObjectives();
    this.clearArena(gameArea);
    this.clearPlayerInventories(players);

    world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
    world.sendMessage(`${this.gameDescription}`);
    world.sendMessage(`⏳ You have ${this.gameTimer / 60} minutes! Good luck!`);

    // Set world settings for the game (Day/Night, Game Mode, Difficulty)
    this.setWorldSettings();

    setupArena(gameArea, ARENA_VECTOR_OFFSET, ARENA_SIZE);

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
  // Clear all scoreboard objectives
  private clearObjectives() {
    try {
      // Get all objectives
      const objectives = world.scoreboard.getObjectives();

      if (objectives.length === 0) {
        world.sendMessage("✅ No scoreboard objectives to clear.");
        return;
      }

      // Remove each objective
      objectives.forEach((objective) => {
        try {
          world.scoreboard.removeObjective(objective);
          world.sendMessage(`🧹 Removed scoreboard objective: ${objective.id}`);
        } catch (error) {
          console.warn(`Failed to remove objective ${objective.id}: ${error}`);
          world.sendMessage(`⚠️ Error removing objective: ${objective.id}`);
        }
      });
    } catch (error) {
      console.warn("Error while clearing scoreboard objectives: " + error);
      world.sendMessage("⚠️ An error occurred while clearing objectives.");
    }
  }

  // Clear the arena by setting the specified area to air
  private clearArena(gameArea: DimensionLocation) {
    const { x, y, z, dimension } = gameArea;
    const arenaSize = 20; // Example: Set arena size (adjust as needed)

    try {
      dimension.runCommand(
        `fill ${x - arenaSize} ${y} ${z - arenaSize} ${x + arenaSize} ${y + 10} ${z + arenaSize} air`
      );

      world.sendMessage(`🧹 Cleared the game arena!`);
    } catch (error) {
      world.sendMessage(`⚠️ Failed to clear arena: ${error}`);
    }
  }

  // Clear the inventories of all players
  private clearPlayerInventories(players: any[]) {
    players.forEach((player) => {
      try {
        // Access the inventory component
        const inventory = player.getComponent("inventory") as EntityInventoryComponent;
        if (inventory && inventory.container) {
          // Loop through all slots and clear them
          for (let i = 0; i < inventory.container.size; i++) {
            inventory.container.setItem(i, undefined); // Clear item in each slot
          }
          player.sendMessage(`🧹 Your inventory has been cleared!`);
        } else {
          player.sendMessage("⚠️ Could not clear inventory. No inventory found.");
        }
      } catch (error) {
        world.sendMessage(`⚠️ Failed to clear inventory for player ${player.name}: ${error}`);
      }
    });
    world.sendMessage("🧹 Cleared all players' inventories!");
  }

  // Map the game mode string to the GameMode enum
  private getGameModeEnum(): GameMode {
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
  private setWorldSettings() {
    // Set the time of day based on the parameter
    if (this.dayOrNight === "day") {
      world.getDimension(MinecraftDimensionTypes.overworld).runCommand("time set day"); // Set to day time
      world.getDimension(MinecraftDimensionTypes.overworld).runCommand("gamerule doDaylightCycle true"); // Enable daylight cycle
    } else {
      world.getDimension(MinecraftDimensionTypes.overworld).runCommand("time set night"); // Set to night time
      world.getDimension(MinecraftDimensionTypes.overworld).runCommand("gamerule doDaylightCycle false"); // Disable daylight cycle
    }

    // Set the world difficulty
    world.getDimension(MinecraftDimensionTypes.overworld).runCommand(`difficulty ${this.difficulty}`);
  }

  // Handle game timer countdown
  private startTimer(players: any[]) {
    this.intervalId = system.runInterval(() => {
      if (this.gameTimer > 0) {
        this.gameTimer--;
        // Update action bar for players
        players.forEach((player) => {
          player.onScreenDisplay.setActionBar(`⏳ Time Remaining: ${this.gameTimer} seconds`);
        });
      } else {
        // End the game when time is up
        this.endGame(players);
        if (this.intervalId) {
          system.clearRun(this.intervalId);
        }
      }
    }, 20); // Run every second (20 ticks)
  }

  // End the game
  endGame(players: any[]) {
    world.sendMessage(`⏳ Time is up! The game ${this.gameName} is over!`);
    players.forEach((player) => {
      // Teleport players back to lobby
      player.teleport({ x: 0, y: 65, z: 0 }); // Adjust this to your lobby coordinates
      player.sendMessage(`🏠 Returning to the lobby!`);
    });
  }

  // Create a new scoreboard objective
  private createScoreObjective() {
    try {
      const objective = world.scoreboard.addObjective("points", "Points");
      world.sendMessage(`✅ Created new scoreboard objective: points`);
      return objective;
    } catch (error: unknown) {
      if (error instanceof Error) {
        world.sendMessage(`⚠️ Failed to create scoreboard objective: ${error.message}`);
        console.error(`Error details: ${error.stack}`);
      } else {
        world.sendMessage(`⚠️ Failed to create scoreboard objective: Unknown error`);
        console.error("Unknown error occurred while creating scoreboard objective.");
      }
      throw error; // Consider logging the stack trace if needed
    }
  }

  // Setup a scoreboard sidebar
  setupScoreboard() {
    let scoreObjective = world.scoreboard.getObjective("points");

    // Create objective only if it doesn't exist
    if (!scoreObjective) {
      scoreObjective = this.createScoreObjective();
      if (!scoreObjective) {
        console.error("Failed to create scoreboard objective.");
        return null; // Handle failure gracefully
      }
    }

    // Ensure the objective is displayed in the sidebar
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
      objective: scoreObjective,
    });

    return scoreObjective;
  }

  // Update points for a player
  updatePlayerScore(player: any, points: number) {
    const objective = world.scoreboard.getObjective("points");
    if (objective) {
      try {
        objective.setScore(player, points);
        console.log(`Updated score for ${player.name}: ${points}`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Failed to update score for ${player.name}: ${error.message}`);
          console.error(`Stack trace: ${error.stack}`);
        } else {
          console.error(`Unknown error occurred while updating score for ${player.name}`);
        }
      }
    } else {
      console.warn(`Scoreboard objective not found. Unable to update score for ${player.name}`);
    }
  }

  resetPlayerScores(players: any[]) {
    // Reset scores for all players
    const objective = world.scoreboard.getObjective("points");
    if (objective) {
      players.forEach((player) => {
        try {
          objective.setScore(player, 0);
          console.log(`Reset score for ${player.name}`);
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error(`Failed to reset score for ${player.name}: ${error.message}`);
            console.error(`Stack trace: ${error.stack}`);
          } else {
            console.error(`Unknown error occurred while resetting score for ${player.name}`);
          }
        }
      });
    } else {
      console.warn(`Scoreboard objective not found. Unable to reset scores.`);
    }
  }
}
