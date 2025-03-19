import { GameSetup } from "./gamesetup";
import { world, system, ItemStack } from "@minecraft/server";
import { setupInventory } from "./setupInventory";
import { spawnNewBlock, spawnMobs, placeRandomBlockItems } from "./gameHelpers";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
// Define Game Config
const gameConfig = {
    name: "Mine the Diamonds!",
    description: "Mine as many diamonds as possible to earn points!",
    timerMinutes: 1,
    gameMode: "survival",
    dayOrNight: "day",
    difficulty: "easy",
    maxPlayers: 10,
    minPlayers: 2,
    arenaSize: { x: 30, y: 10, z: 30 }, // Arena Size Centralized
    arenaoffset: { x: -15, y: -60, z: -15 }, // Arena Offset Centralized,
};
export function Game1(log, location) {
    // Get all players in the world
    const players = world.getAllPlayers();
    // Game Setup Using Config
    const gameSetup = new GameSetup(gameConfig.name, gameConfig.description, gameConfig.timerMinutes, gameConfig.gameMode, gameConfig.dayOrNight, gameConfig.difficulty);
    gameSetup.startGame(players, location, gameConfig.arenaoffset, gameConfig.arenaSize);
    // Player Inventory Setup (changed to pickaxe instead of sword)
    const startingInventory = [
        new ItemStack(MinecraftItemTypes.DiamondPickaxe),
        new ItemStack(MinecraftItemTypes.Dirt, 64), // Changed from DiamondSword to DiamondPickaxe
    ];
    players.forEach((player) => setupInventory(player, startingInventory));
    let curTick = 0;
    let score = 0;
    const blockCountThreshold = gameConfig.arenaSize.x * gameConfig.arenaSize.z * 0.1; // 10% of arena area
    // Threshold for spawning a new block
    let missingDiamondBlocks = 0;
    let lastOreDestroyed = false;
    world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
        // Log the block type before it gets broken
        // Check if the broken block is diamond ore
        if (eventData.block.typeId === "minecraft:diamond_ore") {
            // Log the event when diamond ore is about to be broken
            console.warn("Warning: Diamond ore block about to be broken!");
            lastOreDestroyed = true;
            missingDiamondBlocks++;
            // Log the missing blocks count
            console.warn(`Missing diamond blocks: ${missingDiamondBlocks}`);
            // Update the score when diamond ore is broken
            score++;
            world.sendMessage(`Diamond ore block mined! Score: ${score}`);
            gameSetup.updatePlayerScore(eventData.player, score);
        }
    });
    // Start the game tick AFTER the setup is done
    function startGameTick() {
        // Game tick logic
        function gameTick() {
            try {
                curTick++;
                // Send message to break diamond blocks at tick 100
                if (curTick === 100) {
                    world.sendMessage("BREAK THE DIAMOND BLOCKS!");
                    spawnNewBlock(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:diamond_ore");
                }
                // Every 20 ticks after 100, check for missing blocks and spawn new ones if needed
                if (curTick > 100 && curTick % 20 === 0) {
                    if (lastOreDestroyed && missingDiamondBlocks >= blockCountThreshold) {
                        // Ensure spawnNewBlock function is working
                        spawnNewBlock(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:diamond_ore");
                        missingDiamondBlocks = 0; // Reset the counter after spawning
                        lastOreDestroyed = false; // Reset after spawning the new block
                    }
                }
                // Dynamically adjust spawn interval based on the score
                const spawnInterval = Math.ceil(200 / ((score + 1) / 3));
                if (curTick > 100 && curTick % spawnInterval === 0) {
                    spawnMobs(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:zombie");
                }
                // Randomly add block items every 29 ticks
                if (curTick > 100 && curTick % 29 === 0) {
                    placeRandomBlockItems(gameConfig.arenaoffset, gameConfig.arenaSize, "minecraft:leaves");
                }
            }
            catch (e) {
                console.warn("Tick error: " + e);
            }
            // Continue the game tick
            system.runTimeout(gameTick, 1); // Run every tick
        }
        // Start the game tick after all setup
        system.run(gameTick);
    }
    // Start the game tick after setup is complete
    startGameTick();
}
//# sourceMappingURL=Game1.js.map