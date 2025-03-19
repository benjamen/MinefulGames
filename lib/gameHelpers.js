import { world, BlockPermutation } from "@minecraft/server";
// Function to spawn a block within the arena
export function spawnBlockWithinArena(arenaLocation, arenaSize, blockType // Block type to spawn
) {
    var _a;
    const overworld = world.getDimension("overworld");
    // Generate random coordinates within the arena bounds
    const x = Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2) + arenaLocation.x;
    const y = Math.floor(Math.random() * arenaSize.y) + arenaLocation.y; // Use the y size for height
    const z = Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2) + arenaLocation.z;
    // Rename blockLocation to avoid redeclaration
    const blockSpawnLocation = { x, y, z }; // This is now the unique variable name
    // Send a message to confirm the block creation location
    world.sendMessage(`Creating new ${blockType} at ${blockSpawnLocation.x}, ${blockSpawnLocation.y}, ${blockSpawnLocation.z}`);
    // Set the block at the chosen location
    const blockPermutation = BlockPermutation.resolve(blockType);
    (_a = overworld.getBlock(blockSpawnLocation)) === null || _a === void 0 ? void 0 : _a.setPermutation(blockPermutation);
}
// Function to spawn mobs within the arena
export function spawnMobsWithinArena(arenaLocation, arenaSize, mobType // Mob type to spawn
) {
    const overworld = world.getDimension("overworld");
    const count = Math.floor(Math.random() * 2) + 1; // Randomly decide how many mobs to spawn (1 or 2)
    for (let j = 0; j < count; j++) {
        // Generate random coordinates within the arena
        const x = Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2) + arenaLocation.x;
        const y = Math.floor(Math.random() * arenaSize.y) + arenaLocation.y; // Use the y size for height
        const z = Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2) + arenaLocation.z;
        // Rename mobLocation to avoid redeclaration
        const mobSpawnLocation = { x, y, z }; // This is now the unique variable name
        if (mobType) {
            overworld.spawnEntity(mobType, mobSpawnLocation);
            world.sendMessage(`Spawning ${mobType} at ${mobSpawnLocation.x}, ${mobSpawnLocation.y}, ${mobSpawnLocation.z}`);
        }
        else {
            console.warn(`Invalid mob type: ${mobType}`);
        }
    }
}
// Function to place random blocks within the arena
export function placeRandomBlocksWithinArena(arenaLocation, arenaSize, blockType = "minecraft:leaves" // Default to "minecraft:leaves", but can be changed
) {
    var _a;
    const overworld = world.getDimension("overworld");
    for (let i = 0; i < 10; i++) {
        // Generate random coordinates within the arena
        const x = Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2) + arenaLocation.x;
        const y = Math.floor(Math.random() * arenaSize.y) + arenaLocation.y; // Use the y size for height
        const z = Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2) + arenaLocation.z;
        // Rename blockLocation to avoid redeclaration
        const randomBlockLocation = { x, y, z }; // This is now the unique variable name
        // Define the block permutation using the block type
        const blockPermutation = BlockPermutation.resolve(blockType);
        // Set the block at the chosen position using setPermutation
        (_a = overworld
            .getBlock(randomBlockLocation)) === null || _a === void 0 ? void 0 : _a.setPermutation(blockPermutation); // Use the dynamic block type
    }
}
//# sourceMappingURL=gameHelpers.js.map