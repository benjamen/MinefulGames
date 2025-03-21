// MineTheDiamondsGame.ts
import { world, system, DimensionLocation, GameMode, Player } from "@minecraft/server";
import { GameSetup } from "./GameManager";
import { spawnBlockWithinArena, spawnMobsWithinArena, placeRandomBlocksWithinArena } from "./SpawnManager";
import { updatePlayerScore } from "./ScoreManager";
import { getArenaCenter, getArenaLowerCorner } from "./ArenaHelper";
import { EventManager } from "./EventManager";

class GameState {
    curTick: number = 0;
    score: number = 0;
    missingDiamondBlocks: number = 0;
    lastOreDestroyed: boolean = false;
    players: Player[] = [];
}

const gameState = new GameState();
const overworld = world.getDimension("overworld");
const eventManager = new EventManager();

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
    arenaLocation: { x: 25, y: -50, z: 0 },
    arenaSize: { x: 30, y: 5, z: 30 },
    arenaCenter: getArenaCenter({ x: 25, y: -50, z: 0 }),
    arenaLowerCorner: getArenaLowerCorner(
        { x: 25, y: -50, z: 0 },
        { x: 30, z: 30 },
        overworld
    ),
    startingInventory: [
        { item: "minecraft:diamond_pickaxe", count: 1 },
        { item: "minecraft:dirt", count: 64 },
    ],
};

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
    eventManager.subscribe(
        world.afterEvents.entityDie,
        (eventData) => {
            const entity = eventData.deadEntity;
            if (entity instanceof Player && gameState.players.includes(entity)) {
                world.sendMessage(`☠️ ${entity.name} has died!`);
                endGame();
            }
        }
    );
}

function setupPlayerBreakListener() {
    eventManager.subscribe(
        world.beforeEvents.playerBreakBlock,
        (eventData) => {
            const player = eventData.player;
            const block = eventData.block;

            if (block.typeId === "minecraft:diamond_ore") {
                gameState.lastOreDestroyed = true;
                gameState.missingDiamondBlocks++;
                gameState.score++;
                world.sendMessage(`Diamond ore block mined!`);
                updatePlayerScore(player, gameState.score);
            }
        }
    );
}

function runGameTick() {
    try {
        gameState.curTick++;

        const timeLeft = Math.max(0, gameConfig.gameTime * 60 - Math.floor(gameState.curTick / 20));
        gameSetup?.displayTimer(gameState.players, timeLeft);

        if (gameState.curTick === 1) {
            world.sendMessage("Game Start!");
            placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:leaves");
            spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:zombie");
        } else if (gameState.curTick === 100) {
            world.sendMessage("BREAK THE DIAMOND BLOCKS!");
            spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
        } else if (gameState.curTick > 100) {
            if (gameState.curTick % 20 === 0 && gameState.lastOreDestroyed) {
                spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
                gameState.lastOreDestroyed = false;
            }
            if (gameState.curTick % 100 === 0) {
                placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:leaves");
                spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:zombie");
            }
        }

        if (gameState.curTick > gameConfig.gameTime * 60 * 20 || gameState.players.filter(p => p.isValid()).length < gameConfig.minPlayers) {
            endGame();
            return;
        }

        system.runTimeout(() => runGameTick(), 1);
    } catch (error) {
        console.error(`❌ Game tick error: ${error}`);
        endGame();
    }
}

function endGame() {
    eventManager.unsubscribeAll();
    world.sendMessage("Game Over! Thanks for playing!");
    gameSetup?.endGame(gameState.players, gameState.score);

    // Reset game state
    Object.assign(gameState, {
        curTick: 0,
        score: 0,
        missingDiamondBlocks: 0,
        lastOreDestroyed: false,
        players: [],
    });
}