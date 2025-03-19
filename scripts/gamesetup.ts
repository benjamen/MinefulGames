import {
  world,
  system,
  DimensionLocation,
  DisplaySlotId,
  GameMode,
  MinecraftDimensionTypes,
  EntityInventoryComponent,
  Vector3,
  Player,
} from "@minecraft/server";
import { setupArena } from "./arenaUtils";

export class GameSetup {
  private gameTimer: number = 0; // Time in seconds
  private intervalId: number | undefined;
  private gameName: string;
  private gameDescription: string;
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
    arenaoffset: Vector3,
    arenaSize: { x: number; y: number; z: number }
  ) {
    // Clear previous game data (objectives, arena, and player inventories)
    this.clearObjectives();
    this.clearArena(gameArea, arenaSize);
    this.clearPlayerInventories(players);

    world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
    world.sendMessage(`${this.gameDescription}`);
    world.sendMessage(`⏳ You have ${this.gameTimer / 60} minutes! Good luck!`);

    // Set world settings for the game (Day/Night, Game Mode, Difficulty)
    this.setWorldSettings();

    // In GameSetup.ts
    const locationVector: Vector3 = { x: gameArea.x, y: gameArea.y, z: gameArea.z };
    setupArena(locationVector, arenaoffset, arenaSize);

    const arenaCenter: Vector3 = {
      x: arenaoffset.x + arenaSize.x / 2,
      y: arenaoffset.y + 1, // Ensure y is correct for ground level
      z: arenaoffset.z + arenaSize.z / 2,
    };

    // Teleport players to the center of the arena
    players.forEach((player) => {
      const currentPos = player.location;
      console.warn(`Current position of ${player.name}: x=${currentPos.x}, y=${currentPos.y}, z=${currentPos.z}`);
      console.warn(
        `Teleporting ${player.name} to: x=${arenaCenter.x}, y=${arenaCenter.y}, z=${arenaCenter.z} in dimension ${gameArea.dimension}`
      );
      player.teleport(arenaCenter, gameArea.dimension);
      player.sendMessage(`🚀 Teleporting you to the game area!`);
      player.setGameMode(this.getGameModeEnum()); // Use the helper function to get the correct GameMode value
    });

    // Ensure the scoreboard is set up before the game starts
    const Objective = this.setupScoreboard();

    // Reset points at the start of the game
    this.resetPlayerScores(players, Objective);

    // Start the game timer
    this.startTimer(players);
  }

  // Clear all scoreboard objectives
  // Clear all scoreboard objectives
  private clearObjectives() {
    let scoreObjective = world.scoreboard.getObjective("score");

    if (!scoreObjective) {
      return;
    } else {
      world.scoreboard.removeObjective(scoreObjective);
    }

    try {
      world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
      world.sendMessage("🧹 Removed scoreboard display from sidebar.");
    } catch (error) {
      console.warn("⚠️ Error removing scoreboard display: " + error);
    }
  }

  // Clear the arena by setting the specified area to air
  // Clear the arena by setting the specified area to air and removing all entities
  private clearArena(gameArea: DimensionLocation, arenaSize: { x: number; y: number; z: number }) {
    const { x, y, z, dimension } = gameArea;

    try {
      // Remove all entities within the arena (excluding players)
      dimension.runCommand(
        `kill @e[type=!player,x=${x - arenaSize.x / 2},y=${y},z=${z - arenaSize.z / 2},dx=${arenaSize.x},dy=${
          arenaSize.y
        },dz=${arenaSize.z}]`
      );

      // Fill the area with air
      dimension.runCommand(
        `fill ${x - arenaSize.x / 2} ${y} ${z - arenaSize.z / 2} ${x + arenaSize.x / 2} ${y + arenaSize.y} ${
          z + arenaSize.z / 2
        } air`
      );

      world.sendMessage(`🧹 Cleared the game arena and removed all entities!`);
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
      player.teleport({ x: 20, y: -60, z: -6 }, world.getDimension(MinecraftDimensionTypes.overworld)); // Adjust this to your lobby coordinates
      player.sendMessage(`🏠 Returning to the lobby!`);
      player.setGameMode(GameMode.creative); // Set back to default game mode
    });
  }

  // Setup a scoreboard sidebar
  setupScoreboard() {
    let scoreObjective = world.scoreboard.getObjective("score");

    if (!scoreObjective) {
      scoreObjective = world.scoreboard.addObjective("score", "Score");
    }

    // Ensure the objective is displayed in the sidebar
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
      objective: scoreObjective,
    });

    return scoreObjective;
  }

  // Update points for a player
  // Update points for a player
  updatePlayerScore(player: Player, points: number) {
    try {
      // Use the correct objective name "score" that matches what setupScoreboard creates
      player.runCommand(`scoreboard players set "${player.name}" score ${points}`);
      console.log(`✅ Updated score for ${player.name}: ${points}`);
    } catch (error: unknown) {
      console.error(`❌ Failed to update score for ${player.name}: ${error}`);
    }
  }

  resetPlayerScores(players: any[], Objective: any) {
    // Reset scores for all players
    Objective.setScore(players, 0);
  }
}
