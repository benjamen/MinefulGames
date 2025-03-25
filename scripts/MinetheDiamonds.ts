import { world, GameMode, DimensionLocation } from "@minecraft/server";
import { GameCore } from "./GameCore";

const levelConfigurations = [
    {
        level: 1,
        description: "Mine 3 diamond blocks!",
        goal: 3,
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "Zombie",
        mobCount: 10, // Now properly used in LevelManager.ts
        randomBlockToPlace: "minecraft:leaves",
        gameTime: 60 // 120 seconds = 2 minutes
    },
    {
        level: 2,
        description: "Mine 5 diamonds with creepers!",
        goal: 5,
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "Creeper", 
        mobCount: 3,
        randomBlockToPlace: "minecraft:stone",
        gameTime: 120 // 4 minutes
    },
    {
        level: 3,
        description: "Final level - Mine 10 diamonds!",
        goal: 10,
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "Skeleton",
        mobCount: 3,
        randomBlockToPlace: "minecraft:obsidian",
        gameTime: 240 // 6 minutes
    }
];

let isGameActive = false;

export function MinetheDiamonds(
    log: (message: string, status?: number) => void, 
    defaultLocation: DimensionLocation, 
    params?: string[]
) {
    if (isGameActive) {
        log("Game is already running", -1);
        return;
    }
    isGameActive = true;

    // Parse location from params or use default
    let arenaX = defaultLocation.x;
    let arenaY = defaultLocation.y;
    let arenaZ = defaultLocation.z;

    if (params && params.length >= 3) {
        // If params are provided, try to parse them
        const parsedX = parseInt(params[0]);
        const parsedY = parseInt(params[1]);
        const parsedZ = parseInt(params[2]);

        if (!isNaN(parsedX) && !isNaN(parsedY) && !isNaN(parsedZ)) {
            arenaX = parsedX;
            arenaY = parsedY;
            arenaZ = parsedZ;
            log(`Using custom location: ${arenaX}, ${arenaY}, ${arenaZ}`, 1);
        }
    }

    const game = new GameCore({
        name: "Mine the Diamonds!",
        levelConfigurations,
        arenaLocation: { 
            x: arenaX, 
            y: arenaY, 
            z: arenaZ, 
            dimension: defaultLocation.dimension 
        },
        arenaSize: { x: 30, y: 10, z: 30 },
        arenaSettings: {
            includeWalls: true,
            includeFloor: true,
            includeRoof: false
        },
        lobbyLocation: { 
            x: arenaX - 25,  // Offset lobby from arena 
            y: -60, 
            z: arenaZ 
        },
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
        log("Game ended", 1);
    });

    game.startGame();
}