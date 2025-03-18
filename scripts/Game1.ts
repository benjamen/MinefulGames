import { GameSetup } from "./gamesetup";
import {
  world,
  system,
  DimensionLocation,
  BlockPermutation,
  EntityInventoryComponent,
  ItemStack,
  DisplaySlotId,
  Vector3,
} from "@minecraft/server";
import { setupInventory } from "./setupInventory";
import { createArena } from "./createArena";
import { Vector3Utils } from "@minecraft/math";
import {
  MinecraftBlockTypes,
  MinecraftDimensionTypes,
  MinecraftEntityTypes,
  MinecraftItemTypes,
} from "@minecraft/vanilla-data";

// Define game-specific logic
export function Game1(log: (message: string, status?: number) => void, location: DimensionLocation) {
  const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
  const players = world.getAllPlayers(); // Get all players in the game

  // Instantiate the game setup with specific parameters
  const gameName = "Mine the Diamonds!";
  const gameDescription = "Mine as many diamonds as possible to earn points!";
  const timerMinutes = 15; // Set timer to 15 minutes
  const gameMode = "survival"; // Game mode (use actual GameMode enum or string)
  const dayOrNight: "day" | "night" = "day"; // Set to "day" or "night"
  const difficulty: "peaceful" | "easy" | "normal" | "hard" = "easy"; // Set the desired difficulty
  const maxPlayers = 10; // Max number of players (example value)
  const minPlayers = 2; // Min number of players (example value)
  const playerScores = new Map<string, number>(); // Player name (or UUID) -> Score

  // Include dimension in the game area object
  const gameArea = {
    x: location.x,
    y: location.y,
    z: location.z,
    dimension: location.dimension, // Pass the dimension here
  };

  // Instantiate GameSetup with the updated constructor parameters
  const gameSetup = new GameSetup(
    gameName,
    gameDescription,
    timerMinutes,
    gameMode, // Passing the game mode
    dayOrNight, // Passing the time of day (day or night)
    difficulty // Passing the difficulty level
  );

  // Start the game with the game setup
  gameSetup.startGame(players, gameArea);

  const START_TICK = 100;
  const ARENA_X_SIZE = 30;
  const ARENA_Z_SIZE = 30;
  const ARENA_X_OFFSET = 0;
  const ARENA_Y_OFFSET = -60;
  const ARENA_Z_OFFSET = 0;
  const ARENA_VECTOR_OFFSET: Vector3 = { x: ARENA_X_OFFSET, y: ARENA_Y_OFFSET, z: ARENA_Z_OFFSET };

  // Define starting inventory
  const startingInventory = [
    new ItemStack(MinecraftItemTypes.DiamondSword),
    new ItemStack(MinecraftItemTypes.Dirt, 64),
  ];

  // Define arena dimensions
  const arenaDimensions = {
    xOffset: ARENA_X_OFFSET,
    yOffset: ARENA_Y_OFFSET,
    zOffset: ARENA_Z_OFFSET,
    xSize: ARENA_X_SIZE,
    ySize: 10,
    zSize: ARENA_Z_SIZE,
  };

  // global variables
  let curTick = 0;
  let score = 0;
  let cottaX = 0;
  let cottaZ = 0;
  let spawnCountdown = 1;

  function MinetheDiamonds() {
    // Define the overworld and players

    for (const player of players) {
      playerScores.set(player.name, 0); // Initialize player scores
      setupInventory(player, startingInventory); // Set up player inventory
    }

    world.sendMessage("BREAK THE DIAMOND BLOCKS!");

    // Create the game arena
    createArena(arenaDimensions);
  }

  function gameTick() {
    try {
      curTick++;

      if (curTick === START_TICK) {
        MinetheDiamonds();
      }

      if (curTick > START_TICK && curTick % 20 === 0) {
        // no terracotta exists, and we're waiting to spawn a new one.
        if (spawnCountdown > 0) {
          spawnCountdown--;

          if (spawnCountdown <= 0) {
            spawnNewBlock();
          }
        } else {
          checkForLessBlocks();
        }
      }

      const spawnInterval = Math.ceil(200 / ((score + 1) / 3));
      if (curTick > START_TICK && curTick % spawnInterval === 0) {
        spawnMobs();
      }

      if (curTick > START_TICK && curTick % 29 === 0) {
        addBlockItemsRandomly();
      }
    } catch (e) {
      console.warn("Tick error: " + e);
    }

    system.run(gameTick);
  }

  function spawnNewBlock() {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);

    // create new block
    cottaX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
    cottaZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);

    world.sendMessage("Creating new diamond ore!");
    let block = overworld.getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: cottaX, y: 1, z: cottaZ }));

    if (block) {
      block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.DiamondOre));
    }
  }

  function checkForLessBlocks() {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);

    let block = overworld.getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: cottaX, y: 1, z: cottaZ }));

    if (block && !block.permutation.matches(MinecraftBlockTypes.DiamondOre)) {
      // core block broken, increment player's score
      const players = world.getAllPlayers();
      for (const player of players) {
        const currentScore = playerScores.get(player.name) || 0; // Get current score
        const newScore = currentScore + 1; // Increment by 1
        playerScores.set(player.name, newScore); // Update map
        const scoreObjective = world.scoreboard.getObjective("points"); // Use "points" objective

        if (scoreObjective) {
          scoreObjective.setScore(player, newScore); // Update player's score on scoreboard
        }
      }

      world.sendMessage("You mined the Diamond! Creating new ore in a few seconds.");
      cottaX = -1;
      cottaZ = -1;
      spawnCountdown = 2;
    }
  }

  function spawnMobs() {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);

    // spawn mobs = create 1-2 mobs
    let spawnMobCount = Math.floor(Math.random() * 2) + 1;

    for (let j = 0; j < spawnMobCount; j++) {
      let zombieX = Math.floor(Math.random() * (ARENA_X_SIZE - 2)) - ARENA_X_SIZE / 2;
      let zombieZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 2)) - ARENA_Z_SIZE / 2;

      overworld.spawnEntity(
        MinecraftEntityTypes.Zombie,
        Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: zombieX, y: 1, z: zombieZ })
      );
    }
  }

  function addBlockItemsRandomly() {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);

    for (let i = 0; i < 10; i++) {
      const leafX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
      const leafY = Math.floor(Math.random() * 10);
      const leafZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);

      overworld
        .getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: leafX, y: leafY, z: leafZ }))
        ?.setPermutation(BlockPermutation.resolve("minecraft:leaves"));
    }
  }

  system.run(gameTick);
}
