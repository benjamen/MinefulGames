import { GameSetup } from "./gamesetup";
import { world, system, ItemStack } from "@minecraft/server";
import { setupInventory } from "./setupInventory";
import { spawnNewBlock, spawnMobs, placeRandomBlockItems } from "./gameHelpers";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
/**
 * Define the game configuration.
 * Here we assume arenaOffset represents the lower‐corner of the arena.
 */
const gameConfig = {
    name: "Mine the Diamonds!",
    description: "Mine as many diamonds as possible to earn points!",
    timerMinutes: 2,
    gameMode: "survival",
    dayOrNight: "day",
    difficulty: "easy",
    maxPlayers: 10,
    minPlayers: 1,
    arenaSize: { x: 30, y: 5, z: 30 },
    arenaOffset: { x: 150, y: -60, z: 0 }, //starting location, flat world -60 is ground
};
/**
 * Entry point of Game1.
 * Adjustments:
 * - We construct an arena area (gameArea) based on the arenaOffset and ensure it has the correct dimension.
 * - That same lower-corner is used in arena cleaning.
 * - The GameSetup then computes the arena’s center for teleportation.
 */
export function Game1(log, lobbyLocation // This likely provides the correct dimension
) {
    // Get all players currently in the world.
    const players = world.getAllPlayers().filter(player => !player.hasTag("game1"));
    // Build the game area from the arenaOffset.
    // Make sure the arena lower corner uses the same dimension as the lobby (or intended dimension).
    const arenaLowerCorner = Object.assign(Object.assign({}, gameConfig.arenaOffset), { dimension: world.getDimension("overworld") // Assign the dimension directly
     });
    // Create a GameSetup instance using the configuration.
    const gameSetup = new GameSetup(gameConfig.name, gameConfig.description, gameConfig.timerMinutes, gameConfig.gameMode, gameConfig.dayOrNight, gameConfig.difficulty);
    // Start the game by passing the players, the game area (lower-corner), arenaOffset, and arenaSize.
    // Note: GameSetup.startGame will need to use arenaOffset to compute the arena center.
    gameSetup.startGame(players, gameConfig.arenaOffset, arenaLowerCorner, gameConfig.arenaSize);
    // Set up each player's inventory.
    const startingInventory = [
        new ItemStack(MinecraftItemTypes.DiamondPickaxe),
        new ItemStack(MinecraftItemTypes.Dirt, 64)
    ];
    players.forEach((player) => setupInventory(player, startingInventory));
    // Game tick variables.
    let curTick = 0;
    let score = 0;
    const blockCountThreshold = gameConfig.arenaSize.x * gameConfig.arenaSize.z * 0.1; // 10% of arena area
    let missingDiamondBlocks = 0;
    let lastOreDestroyed = false;
    // Subscribe to block break events to check for diamond ore breaks.
    world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
        if (eventData.block.typeId === "minecraft:diamond_ore") {
            console.warn("Warning: Diamond ore block about to be broken!");
            lastOreDestroyed = true;
            missingDiamondBlocks++;
            // Update the score and notify the world.
            score++;
            world.sendMessage(`Diamond ore block mined! Score: ${score}`);
            // Update the player's score on the scoreboard.
            gameSetup.updatePlayerScore(eventData.player, score);
        }
    });
    // Define the game tick function.
    function gameTick() {
        try {
            curTick++;
            // At tick 100, trigger a diamond ore block spawn.
            if (curTick === 100) {
                world.sendMessage("BREAK THE DIAMOND BLOCKS!");
                // Spawn a new diamond ore block in the arena at the specified arenaOffset.
                spawnNewBlock(gameConfig.arenaOffset, gameConfig.arenaSize, "minecraft:diamond_ore");
            }
            // Every 20 ticks after tick 100, check for missing blocks and spawn new ones if conditions are met.
            if (curTick > 100 && curTick % 20 === 0) {
                if (lastOreDestroyed && missingDiamondBlocks >= blockCountThreshold) {
                    spawnNewBlock(gameConfig.arenaOffset, gameConfig.arenaSize, "minecraft:diamond_ore");
                    missingDiamondBlocks = 0;
                    lastOreDestroyed = false;
                }
            }
            // Dynamically determine a spawn interval based on the score and spawn mobs.
            const spawnInterval = Math.ceil(200 / ((score + 1) / 3));
            if (curTick > 100 && curTick % spawnInterval === 0) {
                spawnMobs(gameConfig.arenaOffset, gameConfig.arenaSize, "minecraft:zombie");
            }
            // Every 29 ticks after tick 100, randomly place block items.
            if (curTick > 100 && curTick % 29 === 0) {
                placeRandomBlockItems(gameConfig.arenaOffset, gameConfig.arenaSize, "minecraft:leaves");
            }
        }
        catch (e) {
            console.warn("Tick error: " + e);
        }
        // Schedule the next tick.
        system.runTimeout(gameTick, 1); // Run every tick
    }
    // Start the game tick loop after all setup is complete.
    system.run(gameTick);
}
//# sourceMappingURL=Game1.js.map