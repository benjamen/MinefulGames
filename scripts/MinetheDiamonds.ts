import { GameSetup } from "./GameManager";
import { world, system, DimensionLocation, GameMode } from "@minecraft/server";
import { spawnBlockWithinArena, spawnMobsWithinArena, placeRandomBlocksWithinArena } from "./SpawnManager";
import { updatePlayerScore } from "./ScoreManager";

// Game state management
class GameState {
  curTick: number = 0;
  score: number = 0;
  missingDiamondBlocks: number = 0;
  lastOreDestroyed: boolean = false;
  players: any[] = world.getAllPlayers().filter((player) => !player.hasTag("MTD"));
}

const gameState = new GameState();
const overworld = world.getDimension("overworld"); // Ensure this dimension is available

/**
 * Game Configuration
 */
const lobbyLocation = { x: 0, y: -60, z: 0 };
const arenaLocation = { x: 25, y: -60, z: 0 };
const arenaSize = { x: 30, y: 5, z: 30 };

const arenaCenter = {
  x: arenaLocation.x,
  y: arenaLocation.y + Math.floor(arenaSize.y / 2),
  z: arenaLocation.z,
};

const arenaLowerCorner = {
  x: arenaLocation.x - Math.floor(arenaSize.x / 2),
  y: arenaLocation.y,
  z: arenaLocation.z - Math.floor(arenaSize.z / 2),
  dimension: overworld, // Linking overworld explicitly
};

const startingInventory = [
  { item: "minecraft:diamond_pickaxe", count: 1 },
  { item: "minecraft:dirt", count: 64 },
];

const gameConfig = {
  name: "Mine the Diamonds!",
  description: "Mine as many diamonds as possible to earn points!",
  timerMinutes: 2,
  gameMode: GameMode.survival,
  dayOrNight: "day",
  difficulty: "easy",
  maxPlayers: 10,
  minPlayers: 1,
  lobbyLocation,
  arenaLocation,
  arenaSize,
  arenaCenter,
  arenaLowerCorner,
  startingInventory,
};

/**
 * Game Entry Point
 */
export function MinetheDiamonds(log: (message: string, status?: number) => void, StartLocation: DimensionLocation) {
  // Initialize the game setup
  const gameSetup = new GameSetup(
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

  gameSetup.startGame(gameState.players);

  /**
   * Cleanup Logic
   */
  function cleanupGame() {
    gameState.curTick = 0;
    gameState.score = 0;
    gameState.missingDiamondBlocks = 0;
    gameState.lastOreDestroyed = false;
  }

  /**
   * Game Tick Loop
   */
  function gameTick() {
    try {
      // Increment the game tick
      gameState.curTick++;

      // Handle different game states
      if (gameState.curTick === 1) handleGameStart();
      if (gameState.curTick === 100) handleDiamondBlockSpawn();
      if (gameState.curTick > 100) {
        handleDynamicDiamondBlockSpawn();
        handleDynamicMobSpawn();
        handleRandomBlockPlacement();
      }

      // Periodic logging for debugging
      if (gameState.curTick % 20 === 0) logGameStatus();

      // End game if conditions are met
      if (shouldEndGame()) {
        endGameSession();
        return; // Stop the loop
      }
    } catch (error) {
      console.warn("Tick error: " + error);
    }

    // Schedule the next tick
    system.runTimeout(gameTick, 50);
  }

  /**
   * Game Start Logic
   */
  function handleGameStart() {
    world.sendMessage("Game Start! Mine as many diamond blocks as possible!");
    setupPlayerBreakListener();
  }

  /**
   * Spawn Initial Diamond Blocks
   */
  function handleDiamondBlockSpawn() {
    world.sendMessage("BREAK THE DIAMOND BLOCKS!");
    spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
  }

  /**
   * Dynamically Spawn Diamond Blocks
   */
  function handleDynamicDiamondBlockSpawn() {
    if (
      gameState.curTick % 20 === 0 &&
      gameState.lastOreDestroyed &&
      gameState.missingDiamondBlocks >= gameConfig.arenaSize.x * gameConfig.arenaSize.z * 0.1
    ) {
      spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
      gameState.missingDiamondBlocks = 0;
      gameState.lastOreDestroyed = false;
    }
  }

  /**
   * Dynamically Spawn Mobs
   */
  function handleDynamicMobSpawn() {
    const spawnInterval = Math.max(200 / (gameState.score + 1), 20);
    if (gameState.curTick % spawnInterval === 0) {
      spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:zombie");
    }
  }

  /**
   * Random Block Placement
   */
  function handleRandomBlockPlacement() {
    if (gameState.curTick % 29 === 0) {
      placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:leaves");
    }
  }

  /**
   * Debug Logging
   */
  function logGameStatus() {
    world.sendMessage(`Current tick: ${gameState.curTick}`);
    world.sendMessage(`Number of players: ${gameState.players.length}`);
  }

  /**
   * Check End Game Condition
   */
  function shouldEndGame() {
    return (
      gameState.curTick > gameConfig.timerMinutes * 60 * 20 ||
      gameState.players.filter((player) => player.isOnline()).length < gameConfig.minPlayers
    );
  }

  /**
   * End Game Session
   */
  function endGameSession() {
    world.sendMessage("Game Over! Thanks for playing!");
    gameSetup.endGame(gameState.players);
    cleanupGame();
  }

  /**
   * Setup Block Break Listener
   */
  function setupPlayerBreakListener() {
    world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
      if (eventData.block.typeId === "minecraft:diamond_ore") {
        gameState.lastOreDestroyed = true;
        gameState.missingDiamondBlocks++;
        gameState.score++;

        world.sendMessage(`Diamond ore block mined! Score: ${gameState.score}`);
        updatePlayerScore(eventData.player, gameState.score);
      }
    });
  }

  // Start the game loop
  system.run(gameTick);
}
