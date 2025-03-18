import { GameSetup } from "./gamesetup";
import { world, system, BlockPermutation, ItemStack, } from "@minecraft/server";
import Utilities from "./Utilities.js";
import { Vector3Utils } from "@minecraft/math";
import { MinecraftBlockTypes, MinecraftDimensionTypes, MinecraftEntityTypes, MinecraftItemTypes, } from "@minecraft/vanilla-data";
// Define game-specific logic
export function Game1(log, location) {
    const players = world.getAllPlayers(); // Get all players in the game
    // Instantiate the game setup with specific parameters
    const gameName = "Break the Terracotta";
    const gameDescription = "Destroy as much terracotta as possible to earn points!";
    const timerMinutes = 15; // Set timer to 15 minutes
    const gameMode = "survival"; // Game mode (use actual GameMode enum or string)
    const dayOrNight = "day"; // Set to "day" or "night"
    const difficulty = "easy"; // Set the desired difficulty
    const maxPlayers = 10; // Max number of players (example value)
    const minPlayers = 2; // Min number of players (example value)
    // Include dimension in the game area object
    const gameArea = {
        x: location.x,
        y: location.y,
        z: location.z,
        dimension: location.dimension, // Pass the dimension here
    };
    // Instantiate GameSetup with the updated constructor parameters
    const gameSetup = new GameSetup(gameName, gameDescription, timerMinutes, gameMode, // Passing the game mode
    dayOrNight, // Passing the time of day (day or night)
    difficulty // Passing the difficulty level
    );
    // Start the game
    gameSetup.startGame(players, gameArea);
    const START_TICK = 100;
    const ARENA_X_SIZE = 30;
    const ARENA_Z_SIZE = 30;
    const ARENA_X_OFFSET = 0;
    const ARENA_Y_OFFSET = -60;
    const ARENA_Z_OFFSET = 0;
    const ARENA_VECTOR_OFFSET = { x: ARENA_X_OFFSET, y: ARENA_Y_OFFSET, z: ARENA_Z_OFFSET };
    const playerScores = new Map(); // Player name (or UUID) -> Score
    // global variables
    let curTick = 0;
    let score = 0;
    let cottaX = 0;
    let cottaZ = 0;
    let spawnCountdown = 1;
    function initializeBreakTheTerracotta() {
        var _a, _b;
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        let scoreObjective = world.scoreboard.getObjective("points"); // Use the one managed by GameSetup
        if (!scoreObjective) {
            log("Score objective not found.", 0);
        }
        // eliminate pesky nearby mobs
        let entities = overworld.getEntities({
            excludeTypes: [MinecraftEntityTypes.Player],
        });
        for (let entity of entities) {
            entity.kill();
        }
        const players = world.getAllPlayers();
        for (const player of players) {
            playerScores.set(player.name, 0); // Reset player score in the map
            if (scoreObjective) {
                scoreObjective.setScore(player, 0); // Reset scoreboard
            }
            let inv = player.getComponent("inventory");
            (_a = inv.container) === null || _a === void 0 ? void 0 : _a.addItem(new ItemStack(MinecraftItemTypes.DiamondSword));
            (_b = inv.container) === null || _b === void 0 ? void 0 : _b.addItem(new ItemStack(MinecraftItemTypes.Dirt, 64));
            player.teleport(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: -3, y: 0, z: -3 }), {
                dimension: overworld,
                rotation: { x: 0, y: 0 },
            });
        }
        world.sendMessage("BREAK THE TERRACOTTA");
        let airBlockPerm = BlockPermutation.resolve(MinecraftBlockTypes.Air);
        let cobblestoneBlockPerm = BlockPermutation.resolve(MinecraftBlockTypes.Cobblestone);
        if (airBlockPerm) {
            Utilities.fillBlock(airBlockPerm, ARENA_X_OFFSET - ARENA_X_SIZE / 2 + 1, ARENA_Y_OFFSET, ARENA_Z_OFFSET - ARENA_Z_SIZE / 2 + 1, ARENA_X_OFFSET + ARENA_X_SIZE / 2 - 1, ARENA_Y_OFFSET + 10, ARENA_Z_OFFSET + ARENA_Z_SIZE / 2 - 1);
        }
        if (cobblestoneBlockPerm) {
            Utilities.fourWalls(cobblestoneBlockPerm, ARENA_X_OFFSET - ARENA_X_SIZE / 2, ARENA_Y_OFFSET, ARENA_Z_OFFSET - ARENA_Z_SIZE / 2, ARENA_X_OFFSET + ARENA_X_SIZE / 2, ARENA_Y_OFFSET + 10, ARENA_Z_OFFSET + ARENA_Z_SIZE / 2);
        }
    }
    function gameTick() {
        try {
            curTick++;
            if (curTick === START_TICK) {
                initializeBreakTheTerracotta();
            }
            if (curTick > START_TICK && curTick % 20 === 0) {
                // no terracotta exists, and we're waiting to spawn a new one.
                if (spawnCountdown > 0) {
                    spawnCountdown--;
                    if (spawnCountdown <= 0) {
                        spawnNewTerracotta();
                    }
                }
                else {
                    checkForTerracotta();
                }
            }
            const spawnInterval = Math.ceil(200 / ((score + 1) / 3));
            if (curTick > START_TICK && curTick % spawnInterval === 0) {
                spawnMobs();
            }
            if (curTick > START_TICK && curTick % 29 === 0) {
                addFuzzyLeaves();
            }
        }
        catch (e) {
            console.warn("Tick error: " + e);
        }
        system.run(gameTick);
    }
    function spawnNewTerracotta() {
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        // create new terracotta
        cottaX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
        cottaZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);
        world.sendMessage("Creating new terracotta!");
        let block = overworld.getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: cottaX, y: 1, z: cottaZ }));
        if (block) {
            block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.YellowGlazedTerracotta));
        }
    }
    function checkForTerracotta() {
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        let block = overworld.getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: cottaX, y: 1, z: cottaZ }));
        if (block && !block.permutation.matches(MinecraftBlockTypes.YellowGlazedTerracotta)) {
            // Terracotta block broken, increment player's score
            const players = world.getAllPlayers();
            for (const player of players) {
                const currentScore = playerScores.get(player.name) || 0; // Get current score
                const newScore = currentScore + 1; // Increment by 1
                playerScores.set(player.name, newScore); // Update map
                const scoreObjective = world.scoreboard.getObjective("points"); // Use "points" objective
                if (scoreObjective) {
                    scoreObjective.setScore(player, newScore); // Update player's score on scoreboard
                }
            }
            world.sendMessage("You broke the terracotta! Creating new terracotta in a few seconds.");
            cottaX = -1;
            cottaZ = -1;
            spawnCountdown = 2;
        }
    }
    function spawnMobs() {
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        // spawn mobs = create 1-2 mobs
        let spawnMobCount = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < spawnMobCount; j++) {
            let zombieX = Math.floor(Math.random() * (ARENA_X_SIZE - 2)) - ARENA_X_SIZE / 2;
            let zombieZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 2)) - ARENA_Z_SIZE / 2;
            overworld.spawnEntity(MinecraftEntityTypes.Zombie, Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: zombieX, y: 1, z: zombieZ }));
        }
    }
    function addFuzzyLeaves() {
        var _a;
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        for (let i = 0; i < 10; i++) {
            const leafX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
            const leafY = Math.floor(Math.random() * 10);
            const leafZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);
            (_a = overworld
                .getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x: leafX, y: leafY, z: leafZ }))) === null || _a === void 0 ? void 0 : _a.setPermutation(BlockPermutation.resolve("minecraft:leaves"));
        }
    }
    system.run(gameTick);
}
//# sourceMappingURL=Game1.js.map