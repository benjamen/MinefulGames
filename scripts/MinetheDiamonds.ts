import { world, system, DimensionLocation, GameMode, Player } from "@minecraft/server";
import { GameSetup } from "./GameManager";
import { spawnBlockWithinArena } from "./SpawnManager";
import { updatePlayerScore, clearObjectives } from "./ScoreManager";

class GameState {
  curTick: number = 0;
  score: number = 0;
  missingDiamondBlocks: number = 0;
  lastOreDestroyed: boolean = false;
  players: Player[] = [];
}

const gameState = new GameState();
const overworld = world.getDimension("overworld");

const gameConfig = {
  name: "Mine the Diamonds!",
  description: "Mine as many diamonds as possible to earn points!",
  timerMinutes: 2,
  gameMode: GameMode.survival,
  dayOrNight: "day",
  difficulty: "easy",
  maxPlayers: 10,
  minPlayers: 1,
  lobbyLocation: { x: 0, y: -60, z: 0 },
  arenaLocation: { x: 25, y: -60, z: 0 },
  arenaSize: { x: 30, y: 5, z: 30 },
  arenaCenter: { x: 25, y: -58, z: 0 },
  arenaLowerCorner: { x: 10, y: -60, z: -15, dimension: overworld },
  startingInventory: [
    { item: "minecraft:diamond_pickaxe", count: 1 },
    { item: "minecraft:dirt", count: 64 },
  ],
};

let blockBreakSubscription: any = null;
let gameSetup: GameSetup | null = null;

export function MinetheDiamonds(log: (message: string, status?: number) => void, StartLocation: DimensionLocation) {
  try {
    // Clear the scoreboard at the start of the game
    clearObjectives();

    // Initialize game state
    if (!world) throw new Error("World object is not available.");
    gameState.players = world.getAllPlayers().filter((player) => player.isValid() && !player.hasTag("MTD"));

    if (gameState.players.length === 0) {
      throw new Error("No valid players found to start the game.");
    }

    // Create game setup instance
    gameSetup = new GameSetup(
      gameConfig.name,
      gameConfig.description,
      gameConfig.gameMode,
      gameConfig.dayOrNight,
      gameConfig.difficulty,
      gameConfig.lobbyLocation,
      gameConfig.arenaLocation,
      gameConfig.arenaSize,
      gameConfig.arenaCenter,
      gameConfig.arenaLowerCorner,
      gameConfig.startingInventory
    );

    if (!gameSetup) {
      throw new Error("Failed to initialize GameSetup.");
    }

    // Start the game
    gameSetup.startGame(gameState.players);

    // Start game loop
    runGameTick();
  } catch (error) {
    console.error(`❌ Game initialization error: ${error}`);
    world.sendMessage("Failed to start game due to an error.");
  }
}

function runGameTick() {
  try {
    if (!gameState) throw new Error("Game state is not initialized.");

    // Get active players
    const activePlayers = gameState.players.filter((player) => player.isValid()).length;

    if (activePlayers === 0) {
      endGame();
      return;
    }

    // Increment tick
    gameState.curTick++;

    // Game logic
    if (gameState.curTick === 1) {
      world.sendMessage("Game Start! Mine as many diamond blocks as possible!");
      setupPlayerBreakListener();
    } else if (gameState.curTick === 100) {
      world.sendMessage("BREAK THE DIAMOND BLOCKS!");
      spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
    } else if (gameState.curTick > 100) {
      // Handle dynamic spawning
      if (gameState.curTick % 20 === 0 && gameState.lastOreDestroyed) {
        spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
        gameState.lastOreDestroyed = false;
      }
    }

    // Check end conditions
    const timeLimit = gameConfig.timerMinutes * 60 * 20; // Convert minutes to ticks
    if (gameState.curTick > timeLimit || activePlayers < gameConfig.minPlayers) {
      endGame();
      return;
    }

    // Schedule next tick
    system.runTimeout(() => runGameTick(), 1);
  } catch (error) {
    console.error(`❌ Game tick error: ${error}`);
    endGame();
  }
}

function setupPlayerBreakListener() {
  try {
    if (!world) throw new Error("World object is not available.");

    if (blockBreakSubscription) {
      blockBreakSubscription.unsubscribe();
    }

    blockBreakSubscription = world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
      try {
        if (!eventData.block || !eventData.player) {
          throw new Error("Invalid block break event data.");
        }

        if (eventData.block.typeId === "minecraft:diamond_ore") {
          gameState.lastOreDestroyed = true;
          gameState.missingDiamondBlocks++;
          gameState.score++;
          world.sendMessage(`Diamond ore block mined! Score: ${gameState.score}`);
          updatePlayerScore(eventData.player, gameState.score);
        }
      } catch (error) {
        console.error(`❌ Error in block break event handler: ${error}`);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to set up player break listener: ${error}`);
  }
}

function endGame() {
  try {
    if (!world) throw new Error("World object is not available.");

    if (blockBreakSubscription) {
      blockBreakSubscription.unsubscribe();
      blockBreakSubscription = null; // Reset the subscription
    }

    world.sendMessage("Game Over! Thanks for playing!");

    if (gameSetup) {
      gameSetup.endGame(gameState.players);
    }

    // Clear the scoreboard at the end of the game
    clearObjectives();

    // Reset game state
    gameState.curTick = 0;
    gameState.score = 0;
    gameState.missingDiamondBlocks = 0;
    gameState.lastOreDestroyed = false;
    gameState.players = [];
  } catch (error) {
    console.error(`❌ Error during game cleanup: ${error}`);
  }
}
