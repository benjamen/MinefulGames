import { GameMode } from "@minecraft/server";
import { MineTheDiamondsLevelManager } from "./LevelManager";

export const MineTheDiamondsConfig = {
  name: "Mine the Diamonds!",
  playerTag: "MTD",
  defaultGamemode: GameMode.survival,
  lives: 3,
  minPlayers: 1,
  arenaSize: { x: 30, y: 10, z: 30 },
  arenaSettings: {
    includeWalls: true,
    includeFloor: true,
    includeRoof: false,
    lighting: false,
  },
  scoreboardConfig: {
    objectiveId: "mtd_diamonds",
    displayName: "Diamonds Mined",
  },
  victoryCondition: "score" as const,
  respawnStrategy: "instant" as const,
  levelManager: MineTheDiamondsLevelManager,
};

export const levelConfigurations = [
  {
    level: 1,
    description: "Mine 10 diamond blocks!",
    goal: 10,
    blockToBreak: "minecraft:diamond_ore",
    randomBlockToPlace: "minecraft:leaves",
    gameTime: 120,
    customData: {
      mobsToSpawn: [
        { type: "zombie", count: 2 },
        { type: "spider", count: 1 },
      ],
    },
  },
  {
    level: 2,
    description: "Mine 5 diamonds with creepers!",
    goal: 5,
    blockToBreak: "minecraft:diamond_ore",
    randomBlockToPlace: "minecraft:stone",
    gameTime: 120,
    customData: {
      mobsToSpawn: [{ type: "creeper", count: 3 }],
    },
  },
  {
    level: 3,
    description: "Final Challenge!",
    goal: 30,
    blockToBreak: "minecraft:diamond_ore",
    randomBlockToPlace: "minecraft:obsidian",
    gameTime: 360,
    customData: {
      mobsToSpawn: [
        { type: "skeleton", count: 3 },
        { type: "enderman", count: 1 },
      ],
    },
  },
];
