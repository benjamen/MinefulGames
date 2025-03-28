import { GameMode } from "@minecraft/server";
import { ZombieSurvivalLevelManager } from "./LevelManager";

export const ZombieSurvivalConfig = {
  name: "Zombie Survival",
  playerTag: "ZS",
  defaultGamemode: GameMode.survival,
  lives: 5,
  minPlayers: 1,
  arenaSize: { x: 50, y: 15, z: 50 },
  arenaSettings: {
    includeWalls: true,
    includeFloor: true,
    includeRoof: true,
    lighting: true,
  },
  scoreboardConfig: {
    objectiveId: "zs_survival",
    displayName: "Survival Time",
  },
  victoryCondition: "survival" as const,
  respawnStrategy: "delayed" as const,
  levelManager: ZombieSurvivalLevelManager,
};

export const levelConfigurations = [
  {
    description: "Survive for 5 minutes!",
    gameTime: 300,
    customData: {
      zombieWave: {
        count: 20,
        types: ["zombie", "husk"],
        spawnInterval: 30,
      },
    },
  },
  {
    description: "Survive the zombie horde!",
    gameTime: 600,
    customData: {
      zombieWave: {
        count: 50,
        types: ["zombie", "husk", "zombie_villager"],
        spawnInterval: 20,
      },
    },
  },
];
