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
import { setupArena, clearArena, clearChunk, getArenaCenter, teleportPlayersToArena } from "./arenaUtils";

export class GameSetup {
  private gameTimer: number = 0;
  private intervalId: number | undefined;
  private gameName: string;
  private gameDescription: string;
  private gameMode: GameMode;
  private dayOrNight: string;
  private difficulty: string;
  private lobbyLocation: Vector3;
  private arenaLocation: Vector3;
  private arenaSize: Vector3;
  private arenaCenter: Vector3;
  private arenaLowerCorner: DimensionLocation;

  constructor(
    gameName: string,
    gameDescription: string,
    timerMinutes: number,
    gameMode: GameMode,
    dayOrNight: string,
    difficulty: string,
    lobbyLocation: Vector3,
    arenaLocation: Vector3,
    arenaSize: Vector3,
    arenaCenter: Vector3,
    arenaLowerCorner: DimensionLocation
  ) {
    if (timerMinutes <= 0) throw new Error("Timer must be greater than 0.");
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

  startGame(players: Player[]) {
    this.initializeGame(players);
    this.startTimer(players);
  }

  private initializeGame(players: Player[]) {
    this.clearObjectives();
    clearArena(this.arenaLowerCorner, this.arenaSize);
    //clearChunk(this.arenaLocation.x, this.arenaLocation.z);
    this.clearPlayerInventories(players);

    world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
    world.sendMessage(`${this.gameDescription}`);
    world.sendMessage(`⏳ You have ${this.gameTimer / 60} minutes! Good luck!`);

    this.setWorldSettings();
    setupArena(this.arenaLocation, this.arenaSize);
    teleportPlayersToArena(players, this.arenaCenter, this.arenaLowerCorner.dimension);

    const objective = this.setupScoreboard();
    if (objective) this.resetPlayerScores(players);
  }

  private clearObjectives() {
    let scoreObjective = world.scoreboard.getObjective("score");
    if (scoreObjective) {
      world.scoreboard.removeObjective(scoreObjective);
      try {
        world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
      } catch (error) {
        console.warn("⚠️ Error removing scoreboard display: " + error);
      }
    }
  }

  private clearPlayerInventories(players: Player[]) {
    players.forEach((player) => {
      try {
        const inventory = player.getComponent("inventory") as EntityInventoryComponent;
        if (inventory && inventory.container) {
          for (let i = 0; i < inventory.container.size; i++) {
            inventory.container.setItem(i, undefined);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to clear inventory for player ${player.name}: ${error}`);
      }
    });
  }

  private setWorldSettings() {
    try {
      const timeSettings: Record<string, number> = { day: 6000, night: 18000 };

      // Ensure dayOrNight value is valid
      if (Object.keys(timeSettings).includes(this.dayOrNight)) {
        world.setTimeOfDay(timeSettings[this.dayOrNight]);

        // Handle the daylight cycle gamerule
        world
          .getDimension(MinecraftDimensionTypes.overworld)
          .runCommand(`gamerule doDaylightCycle ${this.dayOrNight === "day" ? "true" : "false"}`);
      } else {
        console.warn(`Invalid dayOrNight value: "${this.dayOrNight}". Must be "day" or "night".`);
      }
    } catch (error) {
      console.error("Error setting world settings:", error);
    }

    // Set difficulty level
    world.getDimension(MinecraftDimensionTypes.overworld).runCommand(`difficulty ${this.difficulty}`);
  }

  private startTimer(players: Player[]) {
    this.intervalId = system.runInterval(() => {
      if (this.gameTimer > 0) {
        this.gameTimer--;
        players.forEach((player) => {
          player.onScreenDisplay.setActionBar(`⏳ Time Remaining: ${this.gameTimer} seconds`);
        });
      } else {
        this.endGame(players);
        if (this.intervalId) {
          system.clearRun(this.intervalId);
        }
      }
    }, 20);
  }

  endGame(players: Player[]) {
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
    } catch (error) {
      console.error("❌ Failed to set up the scoreboard:", error);
      return null;
    }
  }

  updatePlayerScore(player: Player, points: number) {
    try {
      if (!player || !player.name) throw new Error("Invalid player or player name.");
      player.runCommandAsync(`scoreboard players set "${player.name}" score ${points}`);
    } catch (error) {
      console.error(`❌ Failed to update score for ${player.name}:`, error);
    }
  }

  private resetPlayerScores(players: Player[]) {
    try {
      let scoreObjective = world.scoreboard.getObjective("score");
      if (scoreObjective) {
        players.forEach((player) => {
          player.runCommandAsync(`scoreboard players set "${player.name}" score 0`);
        });
      }
    } catch (error) {
      console.error("❌ Failed to reset player scores:", error);
    }
  }
}
