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
    gameMode: "survival" | "creative" | "adventure" | "spectator",
    dayOrNight: "day" | "night",
    difficulty: "peaceful" | "easy" | "normal" | "hard"
  ) {
    if (timerMinutes <= 0) throw new Error("Timer must be greater than 0.");
    if (!["day", "night"].includes(dayOrNight))
      throw new Error("Invalid dayOrNight value.");
    if (!["survival", "creative", "adventure", "spectator"].includes(gameMode))
      throw new Error("Invalid gameMode value.");
    if (!["peaceful", "easy", "normal", "hard"].includes(difficulty))
      throw new Error("Invalid difficulty value.");

    this.gameName = gameName;
    this.gameDescription = gameDescription;
    this.gameTimer = timerMinutes * 60;
    this.gameMode = gameMode;
    this.dayOrNight = dayOrNight;
    this.difficulty = difficulty;
  }

  /**
   * Display game introduction, initialize the arena and start the game timer.
   *
   * @param players The players participating in the game.
   * @param arenaLowerCorner The lower-corner (starting coordinate) of the arena.
   *                           (Must include the correct dimension.)
   * @param arenaSize Dimensions of the arena ({ x, y, z }).
   */
  startGame(
    players: Player[],
    arenaOffset: { x: number; y: number; z: number },
    arenaLowerCorner: DimensionLocation, // renamed for clarity
    arenaSize: { x: number; y: number; z: number }
  ) {
    this.initializeGame(players, arenaOffset, arenaLowerCorner, arenaSize);
    this.startTimer(players);
  }

  /**
   * Initialize arena and game settings:
   * – Clear objectives, arena area, and player inventories.
   * – Set world settings.
   * – Set up arena boundaries.
   * – Teleport players to the arena’s center.
   * – Set up the scoreboard.
   */
  private initializeGame(
    players: Player[],
    arenaOffset: Vector3,
    arenaLowerCorner: DimensionLocation,
    arenaSize: Vector3
  ) {
    this.clearObjectives();
    this.clearArena(arenaLowerCorner, arenaSize);
    this.clearPlayerInventories(players);

    world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
    world.sendMessage(`${this.gameDescription}`);
    world.sendMessage(`⏳ You have ${this.gameTimer / 60} minutes! Good luck!`);

    this.setWorldSettings();

    // Setup arena boundaries.
    // (Assumes setupArena uses the lower corner as its reference.)
    setupArena(arenaOffset, arenaSize);

    // Compute the arena center from the lower-corner.
    const arenaCenter = this.getArenaCenter(arenaLowerCorner, arenaSize);

      console.warn(`arenaLowerCorner: ${JSON.stringify(arenaLowerCorner)}`);
      console.warn(`Arena Size: ${JSON.stringify(arenaSize)}`);
      console.warn(`Calculated Arena Center: ${JSON.stringify(arenaCenter)}`);

    // Teleport players to the arena center. Here we use the same dimension as arenaLowerCorner.
    this.teleportPlayersToArena(players, arenaCenter, arenaLowerCorner.dimension);

    const objective = this.setupScoreboard();
    if (objective) this.resetPlayerScores(players);
  }

  /**
   * Calculate the arena center based on the arena's lower-corner.
   * (Adds half of the arena dimensions; Y gets an offset of +1 for ground level.)
   */
  private getArenaCenter(
    arenaOffset: Vector3,
    arenaSize: { x: number; y: number; z: number }
    ): Vector3 {
        return {
            x: arenaOffset.x + arenaSize.x / 2 - 5,
            y: arenaOffset.y, // Example: Increase offset if players spawn underground
            z: arenaOffset.z + arenaSize.z / 2 - 5,
        };

    }
  /**
   * Teleport all players to the arena center.
   */
  private teleportPlayersToArena(
    players: Player[],
    arenaCenter: Vector3,
    dimension: any
  ) {
    players.forEach((player) => {
      console.warn(
        `Teleporting ${player.name} to: x=${arenaCenter.x}, y=${arenaCenter.y}, z=${arenaCenter.z}`
      );
      player.teleport(arenaCenter, dimension);
      player.sendMessage("🚀 Teleporting you to the game area!");
      player.setGameMode(this.getGameModeEnum());
    });
  }

  /**
   * Clear all scoreboard objectives.
   */
  private clearObjectives() {
    let scoreObjective = world.scoreboard.getObjective("score");

    if (scoreObjective) {
      world.scoreboard.removeObjective(scoreObjective);
      try {
        world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
        world.sendMessage("🧹 Removed scoreboard display from sidebar.");
      } catch (error) {
        console.warn("⚠️ Error removing scoreboard display: " + error);
      }
    }
  }

  /**
   * Clear the arena by removing all non-player entities and filling the arena area with air.
   *
   * Previously, coordinates were computed as center minus half size.
   * In this revision we assume arenaLowerCorner is the starting coordinate.
   */
  private clearArena(
  arenaLowerCorner: DimensionLocation,
  arenaSize: Vector3
) {
  const { x, y, z, dimension } = arenaLowerCorner;

  // Validate arena size before proceeding.
  if (arenaSize.x <= 0 || arenaSize.y <= 0 || arenaSize.z <= 0) {
    world.sendMessage("⚠️ Invalid arena size. Please check dimensions.");
    return;
  }

  try {
    // Remove all non-player entities within the arena.
    const killCommand = `kill @e[type=!player,x=${x},y=${y},z=${z},dx=${arenaSize.x},dy=${arenaSize.y},dz=${arenaSize.z}]`;
    dimension.runCommand(killCommand);

    // Clear the area by filling it with air.
    const fillCommand = `fill ${x} ${y} ${z} ${x + arenaSize.x} ${y + arenaSize.y} ${z + arenaSize.z} air`;
    dimension.runCommand(fillCommand);

    // Notify success.
    world.sendMessage("🧹 Cleared the game arena and removed all entities!");
  } catch (error) {
    world.sendMessage(`⚠️ Failed to execute 'clearArena': ${error}`);
  }
}

  /**
   * Clear the inventories of all players.
   */
  private clearPlayerInventories(players: Player[]) {
    players.forEach((player) => {
      try {
        // Access the inventory component.
        const inventory = player.getComponent(
          "inventory"
        ) as EntityInventoryComponent;
        if (inventory && inventory.container) {
          // Loop through all slots and clear them.
          for (let i = 0; i < inventory.container.size; i++) {
            inventory.container.setItem(i, undefined);
          }
          player.sendMessage(`🧹 Your inventory has been cleared!`);
        } else {
          player.sendMessage("⚠️ Could not clear inventory. No inventory found.");
        }
      } catch (error) {
        world.sendMessage(
          `⚠️ Failed to clear inventory for player ${player.name}: ${error}`
        );
      }
    });
    world.sendMessage("🧹 Cleared all players' inventories!");
  }

  /**
   * Map the game mode string to the corresponding GameMode enum.
   */
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

  /**
   * Set world settings including time of day, daylight cycle, and difficulty.
   */
  private setWorldSettings() {
    try {
      // Set the time of day.
      const timeSettings = {
        day: 6000,
        night: 18000,
      };

      if (timeSettings[this.dayOrNight] !== undefined) {
        world.setTimeOfDay(timeSettings[this.dayOrNight]);
        const daylightCycle = this.dayOrNight === "day" ? "true" : "false";
        world
          .getDimension(MinecraftDimensionTypes.overworld)
          .runCommand(`gamerule doDaylightCycle ${daylightCycle}`);
      } else {
        console.error(`Invalid value for dayOrNight: ${this.dayOrNight}`);
      }
    } catch (error) {
      console.error("Error occurred while setting world settings:", error);
    }

    world
      .getDimension(MinecraftDimensionTypes.overworld)
      .runCommand(`difficulty ${this.difficulty}`);
  }

  /**
   * Handle the game timer countdown and update players' on-screen action bars.
   */
  private startTimer(players: Player[]) {
    this.intervalId = system.runInterval(() => {
      if (this.gameTimer > 0) {
        this.gameTimer--;
        // Update the action bar for each player.
        players.forEach((player) => {
          player.onScreenDisplay.setActionBar(
            `⏳ Time Remaining: ${this.gameTimer} seconds`
          );
        });
      } else {
        // End the game when the timer is up.
        this.endGame(players);
        if (this.intervalId) {
          system.clearRun(this.intervalId);
        }
      }
    }, 20); // Run every second (20 ticks)
  }

  /**
   * End the game by sending a message, teleporting players back to the lobby, and resetting their game mode.
   */
 endGame(players: Player[]) {
  world.sendMessage(`⏳ Time is up! The game ${this.gameName} is over!`);
  players.forEach((player) => {
    // Teleport players back to the lobby (adjust coordinates as needed).
    player.teleport(
      { x: 20, y: -60, z: -6 },
      { dimension: world.getDimension(MinecraftDimensionTypes.overworld) }
    );
    player.sendMessage(`🏠 Returning to the lobby!`);
    player.setGameMode(GameMode.creative);
  });
}
  /**
   * Setup a scoreboard and display it in the sidebar.
   */
  setupScoreboard() {
    try {
      let scoreObjective = world.scoreboard.getObjective("score");

      world.sendMessage("Setting Up Scoreboard");

      if (!scoreObjective) {
        scoreObjective = world.scoreboard.addObjective("score", "Score");
      }

      world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
        objective: scoreObjective,
      });

      return scoreObjective;
    } catch (error) {
      console.error("❌ Failed to set up the scoreboard:", error);
      return null; // Return null if setup fails
    }
  }

  /**
   * Update the scoreboard points for a specific player.
   */
  updatePlayerScore(player: Player, points: number) {
    try {
      if (!player || !player.name) {
        throw new Error("Invalid player or player name.");
      }
      player.runCommandAsync(
        `scoreboard players set "${player.name}" score ${points}`
      );
      console.log(`✅ Updated score for ${player.name}: ${points}`);
    } catch (error) {
      console.error(`❌ Failed to update score for ${player.name}:`, error);
    }
  }

  /**
   * Reset scoreboard points for all players.
   */
  resetPlayerScores(players: Player[]) {
    if (!players || players.length === 0) {
      console.warn("No players provided for score reset.");
      return;
    }

    players.forEach((player) => {
      try {
        player.runCommandAsync(
          `scoreboard players set "${player.name}" score 0`
        );
        console.log(`✅ Reset score for ${player.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to reset score for player ${player?.name || "unknown"}:`,
          error
        );
      }
    });
  }
}