import { world, system, DimensionLocation, GameMode, Player, Dimension } from "@minecraft/server";
import { GameSetup } from "./GameManager";
import { spawnBlockWithinArena, spawnMobsWithinArena, placeRandomBlocksWithinArena } from "./SpawnManager";
import { updatePlayerScore } from "./ScoreManager";
import { getArenaCenter, getArenaLowerCorner } from "./ArenaHelper";
import { GameCore } from "./GameCore";
import { setupPlayerBreakListener, setupPlayerDeathListener } from "./EventListenersManager";

class GameState {
    missingBlocks: number = 0;
    lastBlockDestroyed: boolean = false;
}

const gameState = new GameState();
const overworld = world.getDimension("overworld");

// Define level configurations
const levelConfigurations = [
    {
        level: 1,
        description: "Mine 10 diamond blocks to complete this level!",
        goal: 1,
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "minecraft:zombie",
        randomBlockToPlace: "minecraft:leaves",
        gameTime: 1, // Minutes
    },
    {
        level: 2,
        description: "Mine 20 diamond blocks while avoiding creepers!",
        goal: 20,
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "minecraft:creeper",
        randomBlockToPlace: "minecraft:stone",
        gameTime: 2, // Minutes
    },
    {
        level: 3,
        description: "Mine 30 diamond blocks with limited time!",
        goal: 30,
        blockToBreak: "minecraft:diamond_ore",
        mobToSpawn: "minecraft:skeleton",
        randomBlockToPlace: "minecraft:obsidian",
        gameTime: 3, // Minutes
    }
];

let currentLevelIndex = 0;
let currentLevel = levelConfigurations[currentLevelIndex];

// Define game configuration
const gameConfig = {
    name: "Mine the Diamonds!",
    description: "Mine as many diamonds as possible to earn points!",
    gameTime: 1, // Minutes
    gameMode: GameMode.survival,
    dayOrNight: "day",
    difficulty: "easy",
    maxPlayers: 10,
    minPlayers: 1,
    lobbyLocation: { x: 0, y: -60, z: 0 },
    arenaLocation: { 
        x: 25, 
        y: -40, 
        z: 0, 
        dimension: overworld // Add dimension
    },
    arenaSize: { x: 30, y: 5, z: 30 },
    defaultGamemode: GameMode.survival, // Default gamemode to reset to
    get arenaCenter() {
        return {
            x: this.arenaLocation.x,
            y: this.arenaLocation.y + 3, // One block above the floor
            z: this.arenaLocation.z,
        };
    },
    get arenaLowerCorner() {
        return {
            x: this.arenaLocation.x - Math.floor(this.arenaSize.x / 2),
            y: this.arenaLocation.y,
            z: this.arenaLocation.z - Math.floor(this.arenaSize.z / 2),
            dimension: overworld,
        };
    },
    startingInventory: [
        { item: "minecraft:diamond_pickaxe", count: 1 },
        { item: "minecraft:dirt", count: 64 },
    ],
    blockToBreak: "minecraft:diamond_ore",
    mobToSpawn: "minecraft:zombie",
    randomBlockToPlace: "minecraft:leaves",
};

let gameSetup: GameSetup | null = null;

// Initialize GameCore
const gameCore = new GameCore({
    gameTime: gameConfig.gameTime,
    minPlayers: gameConfig.minPlayers,
    maxPlayers: gameConfig.maxPlayers,
    arenaLocation: gameConfig.arenaLocation,
    arenaSize: gameConfig.arenaSize,
    defaultGamemode: gameConfig.defaultGamemode,
    lobbyLocation: gameConfig.lobbyLocation,
    levelConfigurations: levelConfigurations, // Pass level configurations
});

// Main game function
// Main game function
export function MinetheDiamonds(log: (message: string, status?: number) => void, StartLocation: DimensionLocation) {
    try {
        // Initialize game state
        if (!world) throw new Error("World object is not available.");
        gameCore.players = world.getAllPlayers().filter((player) => player.isValid() && !player.hasTag("MTD"));

        if (gameCore.players.length === 0) {
            throw new Error("No valid players found to start the game.");
        }

        // Create game setup instance
        gameSetup = new GameSetup(
            gameConfig.name,
            currentLevel.description, // Use current level description
            currentLevel.gameTime, // Use current level game time
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
        gameSetup.startGame(gameCore.players);

        // Set up event listeners
        setupPlayerBreakListener(
            gameCore.eventManager,
            currentLevel.blockToBreak, // Use current level block to break
            (player, blockType) => {
                gameState.lastBlockDestroyed = true;
                gameState.missingBlocks++;
                gameCore.score++;
                world.sendMessage(`Block mined!`);
                updatePlayerScore(player, gameCore.score);

                // Check if level goal is achieved
                if (gameCore.score >= currentLevel.goal) {
                    world.sendMessage(`🎉 Level ${currentLevel.level} completed!`);
                    currentLevelIndex++; // Increment the level index
                    if (currentLevelIndex < levelConfigurations.length) {
                        currentLevel = levelConfigurations[currentLevelIndex]; // Update currentLevel
                        world.sendMessage(`Starting Level ${currentLevel.level}: ${currentLevel.description}`);
                        gameCore.startLevel(currentLevelIndex, (curTick) => {
                            const timeLeft = Math.max(0, currentLevel.gameTime * 60 - Math.floor(curTick / 20));
                            gameSetup?.displayTimer(gameCore.players, timeLeft);

                            // Game-specific logic
                            if (curTick === 1) {
                                world.sendMessage("Game Start!");
                                placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.randomBlockToPlace);
                                spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.mobToSpawn);
                            } else if (curTick === 100) {
                                world.sendMessage("BREAK THE DIAMOND BLOCKS!");
                                spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.blockToBreak);
                            } else if (curTick > 100) {
                                if (curTick % 20 === 0 && gameState.lastBlockDestroyed) {
                                    spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.blockToBreak);
                                    gameState.lastBlockDestroyed = false;
                                }
                                if (curTick % 100 === 0) {
                                    placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.randomBlockToPlace);
                                    spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.mobToSpawn);
                                }
                            }
                        });
                    } else {
                        world.sendMessage("🎉 Congratulations! You have completed all levels!");
                        gameCore.endGame(); // End the game if no more levels
                    }
                }
            }
        );

        setupPlayerDeathListener(
            gameCore.eventManager,
            gameCore.players,
            (player) => {
                world.sendMessage(`☠️ ${player.name} has died!`);
                gameCore.endGame(); // End the game if a player dies
            }
        );

        // Start the first level
        gameCore.startLevel(currentLevelIndex, (curTick) => {
            const timeLeft = Math.max(0, currentLevel.gameTime * 60 - Math.floor(curTick / 20));
            gameSetup?.displayTimer(gameCore.players, timeLeft);

            // Game-specific logic
            if (curTick === 1) {
                world.sendMessage("Game Start!");
                placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.randomBlockToPlace);
                spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.mobToSpawn);
            } else if (curTick === 100) {
                world.sendMessage("BREAK THE DIAMOND BLOCKS!");
                spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.blockToBreak);
            } else if (curTick > 100) {
                if (curTick % 20 === 0 && gameState.lastBlockDestroyed) {
                    spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.blockToBreak);
                    gameState.lastBlockDestroyed = false;
                }
                if (curTick % 100 === 0) {
                    placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.randomBlockToPlace);
                    spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, currentLevel.mobToSpawn);
                }
            }
        });
    } catch (error) {
        console.error(`❌ Game initialization error: ${error instanceof Error ? error.message : error}`);
        world.sendMessage("Failed to start game due to an error.");
        
        // Attempt to clean up in case of initialization error
        if (gameCore) {
            gameCore.endGame();
        }
    }
}