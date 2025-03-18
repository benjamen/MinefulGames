import { GameSetup } from "./gamesetup";
import { world, system, BlockPermutation, ItemStack, Player, Dimension } from "@minecraft/server";
import Utilities from "./Utilities.js";
import { Vector3Utils } from "@minecraft/math";
import {
  MinecraftBlockTypes,
  MinecraftDimensionTypes,
  MinecraftEntityTypes,
  MinecraftItemTypes,
} from "@minecraft/vanilla-data";

interface GameLocation {
  x: number;
  y: number;
  z: number;
  dimension: Dimension;
}

export function Game1(log: (message: string, level?: number) => void, location: GameLocation): void {
  const players: Player[] = world.getAllPlayers();

  const gameName = "Break the Terracotta";
  const gameDescription = "Destroy as much terracotta as possible to earn points!";
  const timerMinutes = 15;
  const gameMode = "survival";
  const dayOrNight = "day";
  const difficulty = "easy";
  const maxPlayers = 10;
  const minPlayers = 2;

  const gameArea = {
    x: location.x,
    y: location.y,
    z: location.z,
    dimension: location.dimension,
  };

  const gameSetup = new GameSetup(gameName, gameDescription, timerMinutes, gameMode, dayOrNight, difficulty);
  gameSetup.startGame(players, gameArea);

  const START_TICK = 100;
  const ARENA_X_SIZE = 30;
  const ARENA_Z_SIZE = 30;
  const ARENA_X_OFFSET = 0;
  const ARENA_Y_OFFSET = -60;
  const ARENA_Z_OFFSET = 0;
  const ARENA_VECTOR_OFFSET = { x: ARENA_X_OFFSET, y: ARENA_Y_OFFSET, z: ARENA_Z_OFFSET };
  const playerScores = new Map<string, number>();

  let curTick = 0;
  let score = 0;
  let cottaX = 0;
  let cottaZ = 0;
  let spawnCountdown = 1;

  function initializeBreakTheTerracotta(): void {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
    let scoreObjective = world.scoreboard.getObjective("points");

    if (!scoreObjective) {
      log("Score objective not found.", 0);
    }

    overworld.getEntities({ excludeTypes: [MinecraftEntityTypes.Player] }).forEach(entity => entity.kill());

    players.forEach(player => {
      playerScores.set(player.name, 0);
      scoreObjective?.setScore(player, 0);
      const inv = player.getComponent("inventory");
      inv?.container?.addItem(new ItemStack(MinecraftItemTypes.DiamondSword));
      inv?.container?.addItem(new ItemStack(MinecraftItemTypes.Dirt, 64));
      player.teleport(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: -3, y: 0, z: -3 }), {
        dimension: overworld,
        rotation: { x: 0, y: 0 },
      });
    });

    world.sendMessage("BREAK THE TERRACOTTA");

    Utilities.fillBlock(BlockPermutation.resolve(MinecraftBlockTypes.Air),
      ARENA_X_OFFSET - ARENA_X_SIZE / 2 + 1,
      ARENA_Y_OFFSET,
      ARENA_Z_OFFSET - ARENA_Z_SIZE / 2 + 1,
      ARENA_X_OFFSET + ARENA_X_SIZE / 2 - 1,
      ARENA_Y_OFFSET + 10,
      ARENA_Z_OFFSET + ARENA_Z_SIZE / 2 - 1);

    Utilities.fourWalls(BlockPermutation.resolve(MinecraftBlockTypes.Cobblestone),
      ARENA_X_OFFSET - ARENA_X_SIZE / 2,
      ARENA_Y_OFFSET,
      ARENA_Z_OFFSET - ARENA_Z_SIZE / 2,
      ARENA_X_OFFSET + ARENA_X_SIZE / 2,
      ARENA_Y_OFFSET + 10,
      ARENA_Z_OFFSET + ARENA_Z_SIZE / 2);
  }

  function gameTick(): void {
    try {
      curTick++;
      if (curTick === START_TICK) initializeBreakTheTerracotta();
      if (curTick > START_TICK && curTick % 20 === 0) spawnCountdown > 0 ? spawnCountdown-- : checkForTerracotta();
      if (curTick > START_TICK && curTick % Math.ceil(200 / ((score + 1) / 3)) === 0) spawnMobs();
      if (curTick > START_TICK && curTick % 29 === 0) addFuzzyLeaves();
    } catch (e) {
      console.warn("Tick error: " + e);
    }
    system.run(gameTick);
  }

  function spawnNewTerracotta(): void {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
    cottaX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
    cottaZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);
    world.sendMessage("Creating new terracotta!");
    overworld.getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: cottaX, y: 1, z: cottaZ }))?.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.YellowGlazedTerracotta));
  }

  function checkForTerracotta(): void {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
    const block = overworld.getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: cottaX, y: 1, z: cottaZ }));
    if (block && !block.permutation.matches(MinecraftBlockTypes.YellowGlazedTerracotta)) {
      players.forEach(player => {
        const newScore = (playerScores.get(player.name) || 0) + 1;
        playerScores.set(player.name, newScore);
        world.scoreboard.getObjective("points")?.setScore(player, newScore);
      });
      world.sendMessage("You broke the terracotta! Creating new terracotta in a few seconds.");
      cottaX = -1;
      cottaZ = -1;
      spawnCountdown = 2;
    }
  }

  function spawnMobs(): void {
    const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
    for (let j = 0; j < Math.floor(Math.random() * 2) + 1; j++) {
      overworld.spawnEntity(MinecraftEntityTypes.Zombie, Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: Math.random() * (ARENA_X_SIZE - 2) - ARENA_X_SIZE / 2, y: 1, z: Math.random() * (ARENA_Z_SIZE - 2) - ARENA_Z_SIZE / 2 }));
    }
  }

  system.run(gameTick);
}
