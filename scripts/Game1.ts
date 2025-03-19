import { GameSetup } from "./gamesetup";
import { world, system, DimensionLocation, ItemStack, Vector3 } from "@minecraft/server";
import { setupInventory } from "./setupInventory";
import { spawnNewBlock, checkForLessBlocks, spawnMobs, placeRandomBlockItems } from "./gameHelpers";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";

// Define a GameConfig Interface
interface GameConfig {
  name: string;
  description: string;
  timerMinutes: number;
  gameMode: "survival" | "creative" | "adventure" | "spectator";
  dayOrNight: "day" | "night";
  difficulty: "peaceful" | "easy" | "normal" | "hard";
  maxPlayers: number;
  minPlayers: number;
  arenaSize: { x: number; y: number; z: number };
  arenaoffset: Vector3;
}

// Define Game Config
const gameConfig: GameConfig = {
  name: "Mine the Diamonds!",
  description: "Mine as many diamonds as possible to earn points!",
  timerMinutes: 1,
  gameMode: "survival",
  dayOrNight: "day",
  difficulty: "easy",
  maxPlayers: 10,
  minPlayers: 2,
  arenaSize: { x: 30, y: 10, z: 30 }, // Arena Size Centralized
  arenaoffset: { x: 0, y: -60, z: 0 },
};

export function Game1(log: (message: string, status?: number) => void, location: DimensionLocation) {
  const overworld = world.getDimension("overworld");
  const players = world.getAllPlayers();
  const playerScores = new Map<string, number>();

  // Game Setup Using Config
  const gameSetup = new GameSetup(
    gameConfig.name,
    gameConfig.description,
    gameConfig.timerMinutes,
    gameConfig.gameMode,
    gameConfig.dayOrNight,
    gameConfig.difficulty
  );

  gameSetup.startGame(players, location, gameConfig.arenaoffset, gameConfig.arenaSize);
  const scoreObjective = gameSetup.setupScoreboard(); // Set up the scoreboard
  gameSetup.resetPlayerScores(players);

  // Player Inventory Setup (changed to pickaxe instead of sword)
  const startingInventory = [
    new ItemStack(MinecraftItemTypes.DiamondPickaxe),
    new ItemStack(MinecraftItemTypes.Dirt, 64), // Changed from DiamondSword to DiamondPickaxe
  ];
  players.forEach((player) => setupInventory(player, startingInventory));

  let curTick = 0;
  let score = 0;

  const blockCountThreshold = 100; // Threshold for spawning a new block

  let missingDiamondBlocks = 0;
  let lastOreDestroyed = false;

  world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
    // Log the block type before it gets broken

    // Check if the broken block is diamond ore
    if (eventData.block.typeId === "minecraft:diamond_ore") {
      // Log the event when diamond ore is about to be broken
      console.warn("Warning: Diamond ore block about to be broken!");

      lastOreDestroyed = true;
      missingDiamondBlocks++;

      // Log the missing blocks count
      console.warn(`Missing diamond blocks: ${missingDiamondBlocks}`);

      players.forEach((player) => {
        const currentScore = playerScores.get(player.name) || 0;
        const newScore = currentScore + 1;
        playerScores.set(player.name, newScore);

        // Log the updated score for the player
        console.warn(`Updated score for ${player.name}: ${newScore}`);

        gameSetup.updatePlayerScore(player, newScore);
      });

      world.sendMessage(`Diamond ore block destroyed. Missing blocks: ${missingDiamondBlocks}`);
    }
  });

  // Start the game tick AFTER the setup is done
  function startGameTick() {
    // Game tick logic
    function gameTick() {
      try {
        curTick++;

        // Send message to break diamond blocks at tick 100
        if (curTick === 100) {
          world.sendMessage("BREAK THE DIAMOND BLOCKS!");
          spawnNewBlock(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:diamond_ore");
        }

        // Every 20 ticks after 100, check for missing blocks and spawn new ones if needed
        if (curTick > 100 && curTick % 20 === 0) {
          if (lastOreDestroyed && missingDiamondBlocks >= blockCountThreshold) {
            // Ensure spawnNewBlock function is working
            spawnNewBlock(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:diamond_ore");
            missingDiamondBlocks = 0; // Reset the counter after spawning
            lastOreDestroyed = false; // Reset after spawning the new block
          }
        }

        // Dynamically adjust spawn interval based on the score
        const spawnInterval = Math.ceil(200 / ((score + 1) / 3));
        if (curTick > 100 && curTick % spawnInterval === 0) {
          spawnMobs(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:zombie");
        }

        // Randomly add block items every 29 ticks
        if (curTick > 100 && curTick % 29 === 0) {
          placeRandomBlockItems(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:leaves");
        }
      } catch (e) {
        console.warn("Tick error: " + e);
      }

      // Continue the game tick
      system.run(gameTick);
    }

    // Start the game tick after all setup
    system.run(gameTick);
  }

  // Start the game tick after setup is complete
  startGameTick();
}
