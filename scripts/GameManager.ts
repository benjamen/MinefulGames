import { GameMode, Player, DimensionLocation } from "@minecraft/server";
import { setupArena, clearArena, teleportPlayersToLobby, teleportPlayersToArena } from "./ArenaManager";
import { setupScoreboard, resetPlayerScores } from "./ScoreManager";
import { setWorldSettings } from "./WorldManager";
import { setupPlayers } from "./PlayerManager";
import { world } from "@minecraft/server";

export class GameSetup {
  private gameName: string;
  private gameDescription: string;
  private gameMode: GameMode;
  private dayOrNight: string;
  private difficulty: string;
  private lobbyLocation: { x: number; y: number; z: number };
  private arenaLocation: { x: number; y: number; z: number };
  private arenaSize: { x: number; y: number; z: number };
  private arenaCenter: { x: number; y: number; z: number };
  private arenaLowerCorner: DimensionLocation;
  private startingInventory: Array<{ item: string; count: number }>;

  constructor(
    gameName: string,
    gameDescription: string,
    gameMode: GameMode,
    dayOrNight: string,
    difficulty: string,
    lobbyLocation: { x: number; y: number; z: number },
    arenaLocation: { x: number; y: number; z: number },
    arenaSize: { x: number; y: number; z: number },
    arenaCenter: { x: number; y: number; z: number },
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
    teleportPlayersToArena(players, this.arenaLocation, "overworld");

    const objective = setupScoreboard();
    if (objective) resetPlayerScores(players);
  }

  endGame(players: Player[]) {
    console.log(`⏳ Time is up! The game ${this.gameName} is over!`);
    teleportPlayersToLobby(players, this.lobbyLocation, "overworld");
    players.forEach((player) => player.setGameMode(GameMode.creative));
  }


  displayTimer(timeLeft: number) {
        // Code to display the timer at the bottom of the screen
       
    }

}


