import { GameMode, Player, DimensionLocation } from "@minecraft/server";
import { setupArena, clearArena, teleportPlayersToLobby, teleportPlayersToArena } from "./ArenaManager";
import { setupScoreboard, resetPlayerScores, clearObjectives } from "./ScoreManager";
import { setWorldSettings } from "./WorldManager";
import { setupPlayers } from "./PlayerManager";
import { world } from "@minecraft/server";

export class GameSetup {
  private gameName: string;
  private gameDescription: string;
  private gameTime: number; //in Minutes
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
    gameTime: number,
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
    this.gameTime = gameTime;
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
    

    world.sendMessage(`🎮 Welcome to ${this.gameName}!`);
    world.sendMessage(`${this.gameDescription}`);

    setWorldSettings(this.dayOrNight, this.difficulty);
    setupArena(this.arenaLocation, this.arenaSize);

    setupPlayers(players, this.startingInventory, this.gameMode);
    teleportPlayersToArena(players, this.arenaLocation, "overworld");

    this.displayStartTimer(players, this.gameTime);

    const objective = setupScoreboard(players);
    if (objective) resetPlayerScores(players);


  }

  displayStartTimer(players: Player[], gameTime: number) {
   try {
      if (!players || players.length === 0) {
        throw new Error("No players provided to end Game.");
      }

      // Example: Display the timer for each player
      players.forEach((player) => {
        player.onScreenDisplay.setTitle("Mine the Diamonds!", {
          subtitle: `You have: ${gameTime} minutes`, // Use template literals for dynamic score
          fadeInDuration: 1,
          stayDuration: 60,
          fadeOutDuration: 1,
        });
      });
    } catch (error) {
      console.error(`❌ Error in Display Start Timer: ${error}`);
    }
  }


  endGame(players: Player[], score: number) {
    try {

      // Example: Display the timer for each player
      players.forEach((player) => {
        player.onScreenDisplay.setTitle("Game Over!", {
          subtitle: `Score: ${score}`, // Use template literals for dynamic score
          fadeInDuration: 1,
          stayDuration: 120,
          fadeOutDuration: 1,
        });
      });
    } catch (error) {
      console.error(`❌ Error in End Game: ${error}`);
    }
  
    teleportPlayersToLobby(players, this.lobbyLocation, "overworld");
    players.forEach((player) => player.setGameMode(GameMode.creative));
        // Clear the scoreboard at the end of the game
    clearObjectives(players);
    clearArena(this.arenaLowerCorner, this.arenaSize);
  }


  displayTimer(players: Player[], timeLeft: number) {
  try {
    if (!players || players.length === 0) {
      throw new Error("No players provided to display the timer.");
    }

    // Display the timer in the action bar for each player
    players.forEach((player) => {
      if (player) { // Check if the player object exists
        player.onScreenDisplay.setActionBar(`⏳ Time Left: ${timeLeft} seconds`);
      } else {
        console.warn("Invalid player encountered. Skipping timer display.");
      }
    });
  } catch (error) {
    console.error(`❌ Error in displayTimer: ${error}`);
  }
}

}


