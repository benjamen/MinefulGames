import { world, system, DimensionLocation, GameMode, Player } from "@minecraft/server";
import { GameSetup } from "./GameManager";
import { spawnBlockWithinArena, spawnMobsWithinArena, placeRandomBlocksWithinArena } from "./SpawnManager";
import { updatePlayerScore } from "./ScoreManager";

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
  gameTime: 1, //Minutes
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
let deathSubscription: any = null; // New subscription for death events
let gameSetup: GameSetup | null = null;

export function MinetheDiamonds(log: (message: string, status?: number) => void, StartLocation: DimensionLocation) {
  try {

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
      gameConfig.gameTime,
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

    setupPlayerBreakListener();
    setupPlayerDeathListener();


    // Start game loop
    runGameTick();
  } catch (error) {
    console.error(`❌ Game initialization error: ${error}`);
    world.sendMessage("Failed to start game due to an error.");
  }
}

function setupPlayerDeathListener() {
  try {
    if (!world) throw new Error("World object is not available.");

    // Unsubscribe if already subscribed
    if (deathSubscription) {
      deathSubscription = null; // Reset the subscription
    }

    // Subscribe to the entityDie event
    deathSubscription = world.afterEvents.entityDie.subscribe((eventData) => {
      try {
        const entity = eventData.deadEntity;

        // Check if the entity that died is a player
        if (entity instanceof Player && gameState.players.includes(entity)) {
          world.sendMessage(`☠️ ${entity.name} has died!`);
          endGame();

        }
      } catch (error) {
        console.error(`❌ Error in death event handler: ${error}`);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to set up death event listener: ${error}`);
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

    // Calculate time left in seconds
    const timeLeft = Math.max(0, gameConfig.gameTime * 60 - Math.floor(gameState.curTick / 20));

    // Update the timer display
    if (gameSetup) {
      gameSetup.displayTimer(gameState.players, timeLeft);
    }

    // Game logic
    if (gameState.curTick === 1) {
      world.sendMessage("Game Start! Mine as many diamond blocks as possible!");

      // Spawn initial leaves and mobs
      placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:leaves");
      spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:zombie");
    } else if (gameState.curTick === 100) {
      world.sendMessage("BREAK THE DIAMOND BLOCKS!");
      spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
    } else if (gameState.curTick > 100) {
      // Handle dynamic spawning
      if (gameState.curTick % 20 === 0 && gameState.lastOreDestroyed) {
        spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
        gameState.lastOreDestroyed = false;
      }

      // Spawn additional leaves and mobs periodically
      if (gameState.curTick % 100 === 0) {
        // Every 5 seconds (100 ticks)
        placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:leaves");
        spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:zombie");
      }
    }

    // Check end conditions
    const timeLimit = gameConfig.gameTime * 60 * 20; // Convert minutes to ticks
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

    // Unsubscribe if already subscribed
    if (blockBreakSubscription) {
      blockBreakSubscription = null; // Reset the subscription before reassigning
    }

    blockBreakSubscription = world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
      try {
        const player = eventData.player;
        const block = eventData.block;

        if (!block || !player ) {
          throw new Error("Invalid block break event data.");
        }

        if (block.typeId === "minecraft:diamond_ore") {
          gameState.lastOreDestroyed = true;
          gameState.missingDiamondBlocks++;
          gameState.score++;

          world.sendMessage(`Diamond ore block mined!`);
          updatePlayerScore(player, gameState.score);
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

    // Unsubscribe from events
    if (blockBreakSubscription) {
      blockBreakSubscription = null;
    }

    if (deathSubscription) {
      deathSubscription = null;
    }

    world.sendMessage("Game Over! Thanks for playing!");

    if (gameSetup) {
      gameSetup.endGame(gameState.players, gameState.score);
    }



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