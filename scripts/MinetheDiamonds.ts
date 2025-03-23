import { world, GameMode } from "@minecraft/server";
import { GameCore } from "./GameCore";

const levelConfigurations = [
    {
        level: 1,
        description: "Mine 10 diamond blocks!",
        goal: 1, // Fixed goal to match description
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "Zombie", // Match MinecraftEntityTypes key names
        randomBlockToPlace: "minecraft:leaves",
        gameTime: 60
    },
    {
        level: 2,
        description: "Mine 20 diamonds with creepers!",
        goal: 2, // Fixed goal to match description
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "Creeper", 
        randomBlockToPlace: "minecraft:stone",
        gameTime: 120
    },
    {
        level: 3,
        description: "Final level - Mine 30 diamonds!",
        goal: 3, // Fixed goal to match description
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "Skeleton",
        randomBlockToPlace: "minecraft:obsidian",
        gameTime: 180
    }
];

let isGameActive = false;

export function MinetheDiamonds() {
    if (isGameActive) {
        console.warn("Game is already running");
        return;
    }
    isGameActive = true;

    const game = new GameCore({
        name: "Mine the Diamonds!",
        levelConfigurations,
        arenaLocation: { x: 25, y: -40, z: 0, dimension: world.getDimension("overworld") },
        arenaSize: { x: 30, y: 10, z: 30 }, // Increase height to 10 for better mob placement
        arenaSettings: {
            includeWalls: true,
            includeFloor: true,
            includeRoof: false
        },
        lobbyLocation: { x: 0, y: -60, z: 0 },
        startingInventory: [
            { item: "minecraft:diamond_pickaxe", count: 1 },
            { item: "minecraft:dirt", count: 64 }
        ],
        defaultGamemode: GameMode.survival,
        minPlayers: 1,
        lives: 3,
        scoreboardConfig: {
            objectiveId: "mtd_diamonds",
            displayName: "Diamonds Mined"
        }
    }, () => {
        isGameActive = false;
    });

    game.startGame();
}