import { GameMode, Player } from "@minecraft/server";
import { setupArena, clearArena, teleportPlayersToArena } from "./ArenaManager";
import { setupScoreboard, resetPlayerScores } from "./ScoreManager";
import { setWorldSettings } from "./WorldManager";
import { setupPlayers } from "./PlayerManager"; // Now handles inventory and game mode
import { world, Vector3, DimensionLocation } from "@minecraft/server";

export class GameSetup {
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
  private startingInventory: Array<{ item: string; count: number }> = [];

  constructor(
    gameName: string,
    gameDescription: string,
    gameMode: GameMode,
    dayOrNight: string,
    difficulty: string,
    lobbyLocation: Vector3,
    arenaLocation: Vector3,
    arenaSize: Vector3,
    arenaCenter: Vector3,
    arenaLowerCorner: DimensionLocation,
    startingInventory: Array<{ item: string; count: number }>
  ) {
    this.gameName = gameName;
    this.gameDescription = gameDescription;
    this.gameMode = gameMode;
    this.dayOrNight = dayOrNight;
    this.difficulty = difficulty;
    this.lobbyLocation = lobbyLocation;
    this.arenaLocation = arenaLocation;
    this.arenaSize = arenaSize;
    this.arenaCenter = arenaCenter;
    this.arenaLowerCorner = arenaLowerCorner;
    this.startingInventory = startingInventory;
  }

  startGame(players: Player[]) {
    this.initializeGame(players);
  }

  private initializeGame(players: Player[]) {
    clearArena(this.arenaLowerCorner, this.arenaSize);

    world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
    world.sendMessage(`${this.gameDescription}`);

    setWorldSettings(this.dayOrNight, this.difficulty);
    setupArena(this.arenaLocation, this.arenaSize);

    // Now this method does everything needed
    setupPlayers(players, this.startingInventory, this.gameMode);

    const objective = setupScoreboard();
    if (objective) resetPlayerScores(players);
  }

  endGame(players: Player[]) {
    world.sendMessage(`⏳ Time is up! The game ${this.gameName} is over!`);
    teleportPlayersToArena(players, this.lobbyLocation, "overworld");
    players.forEach((player) => player.setGameMode(GameMode.creative));
  }
}
