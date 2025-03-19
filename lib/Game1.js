import { GameSetup } from "./gamesetup";
import { world, system, ItemStack, GameMode, } from "@minecraft/server";
import { setupInventory } from "./setupInventory";
import { spawnBlockWithinArena, spawnMobsWithinArena, placeRandomBlocksWithinArena } from "./gameHelpers";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
const players = world.getAllPlayers().filter(player => !player.hasTag("game1"));
const overworld = world.getDimension("overworld");
/**
 * Game Configuration
 */
const lobbyLocation = { x: 0, y: -60, z: 0 };
const arenaLocation = { x: 25, y: -60, z: 0 }; // Center of the arena
const arenaSize = { x: 30, y: 5, z: 30 };
const arenaCenter = {
    x: arenaLocation.x,
    y: arenaLocation.y + Math.floor(arenaSize.y / 2),
    z: arenaLocation.z,
};
const arenaLowerCorner = {
    x: arenaLocation.x - Math.floor(arenaSize.x / 2),
    y: arenaLocation.y,
    z: arenaLocation.z - Math.floor(arenaSize.z / 2),
    dimension: overworld, // Assuming overworld is defined elsewhere
};
const gameConfig = {
    name: "Mine the Diamonds!",
    description: "Mine as many diamonds as possible to earn points!",
    timerMinutes: 2,
    gameMode: GameMode.survival,
    dayOrNight: "day",
    difficulty: "easy",
    maxPlayers: 10,
    minPlayers: 1,
    lobbyLocation,
    arenaLocation,
    arenaSize,
    // Using calculated values
    arenaCenter,
    arenaLowerCorner,
};
/**
 * Game Entry Point
 */
export function Game1(log, StartLocation // This likely provides the correct dimension
) {
    const gameSetup = new GameSetup(gameConfig.name, gameConfig.description, gameConfig.timerMinutes, gameConfig.gameMode, gameConfig.dayOrNight, gameConfig.difficulty, gameConfig.lobbyLocation, gameConfig.arenaLocation, gameConfig.arenaSize, gameConfig.arenaCenter, gameConfig.arenaLowerCorner);
    gameSetup.startGame(players);
    // Set up player inventory
    const startingInventory = [
        new ItemStack(MinecraftItemTypes.DiamondPickaxe),
        new ItemStack(MinecraftItemTypes.Dirt, 64),
    ];
    players.forEach(player => setupInventory(player, startingInventory));
    // Game State Variables
    let curTick = 0;
    let score = 0;
    const blockCountThreshold = gameConfig.arenaSize.x * gameConfig.arenaSize.z * 0.1;
    let missingDiamondBlocks = 0;
    let lastOreDestroyed = false;
    // Track diamond ore breaks
    world.beforeEvents.playerBreakBlock.subscribe(eventData => {
        if (eventData.block.typeId === "minecraft:diamond_ore") {
            lastOreDestroyed = true;
            missingDiamondBlocks++;
            score++;
            world.sendMessage(`Diamond ore block mined! Score: ${score}`);
            gameSetup.updatePlayerScore(eventData.player, score);
        }
    });
    // Game Tick Loop
    function gameTick() {
        try {
            curTick++;
            if (curTick === 100) {
                world.sendMessage("BREAK THE DIAMOND BLOCKS!");
                spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
            }
            if (curTick > 100 && curTick % 20 === 0 && lastOreDestroyed && missingDiamondBlocks >= blockCountThreshold) {
                spawnBlockWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:diamond_ore");
                missingDiamondBlocks = 0;
                lastOreDestroyed = false;
            }
            if (curTick > 100 && curTick % Math.ceil(200 / ((score + 1) / 3)) === 0) {
                spawnMobsWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:zombie");
            }
            if (curTick > 100 && curTick % 29 === 0) {
                placeRandomBlocksWithinArena(gameConfig.arenaLocation, gameConfig.arenaSize, "minecraft:leaves");
            }
        }
        catch (e) {
            console.warn("Tick error: " + e);
        }
        system.runTimeout(gameTick, 1);
    }
    system.run(gameTick);
}
//# sourceMappingURL=Game1.js.map