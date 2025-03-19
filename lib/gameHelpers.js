import { world, BlockPermutation } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
export function spawnNewBlock(ARENA_VECTOR_OFFSET, ARENA_SIZE, blockType // Accept block type to spawn
) {
    const overworld = world.getDimension("overworld");
    // Randomly select coordinates within the arena (for X, Y, and Z)
    const x = Math.floor(Math.random() * ARENA_SIZE.x) - ARENA_SIZE.x / 2;
    const z = Math.floor(Math.random() * ARENA_SIZE.z) - ARENA_SIZE.z / 2;
    // Dynamically choose Y-coordinate (e.g., between 1 and 10 in the arena height)
    const y = Math.floor(Math.random() * 10) + 1; // Change this depending on the height of your arena
    world.sendMessage(`Creating new ${blockType} at ${x}, ${y}, ${z}!`);
    // Get the block at the calculated position
    const blockLocation = Vector3Utils.add(ARENA_VECTOR_OFFSET, { x, y, z });
    const block = overworld.getBlock(blockLocation);
    // Resolve the block type into a BlockPermutation
    const blockPermutation = BlockPermutation.resolve(blockType);
    // Place the block at the calculated position if there's no block there
    if (block) {
        block.setPermutation(blockPermutation);
    }
}
export function spawnMobs(ARENA_VECTOR_OFFSET, ARENA_SIZE, mobType // Accept mob type to spawn (e.g., "minecraft:zombie")
) {
    const overworld = world.getDimension("overworld");
    const count = Math.floor(Math.random() * 2) + 1; // Randomly decide how many mobs to spawn (1 or 2)
    for (let j = 0; j < count; j++) {
        // Randomly select coordinates within the arena
        const x = Math.floor(Math.random() * (ARENA_SIZE.x - 2)) - ARENA_SIZE.x / 2;
        const z = Math.floor(Math.random() * (ARENA_SIZE.z - 2)) - ARENA_SIZE.z / 2;
        if (mobType) {
            overworld.spawnEntity(mobType, Vector3Utils.add(ARENA_VECTOR_OFFSET, { x, y: 1, z }));
        }
        else {
            console.warn(`Invalid mob type: ${mobType}`);
        }
    }
}
export function placeRandomBlockItems(ARENA_VECTOR_OFFSET, ARENA_SIZE, blockType = "minecraft:leaves" // Default to "minecraft:leaves", but can be changed
) {
    var _a;
    const overworld = world.getDimension("overworld");
    for (let i = 0; i < 10; i++) {
        // Randomly select coordinates within the arena
        const x = Math.floor(Math.random() * (ARENA_SIZE.x - 1)) - (ARENA_SIZE.x / 2 - 1);
        const y = Math.floor(Math.random() * 10); // Random height for blocks
        const z = Math.floor(Math.random() * (ARENA_SIZE.z - 1)) - (ARENA_SIZE.z / 2 - 1);
        // Set the block at the chosen position
        (_a = overworld
            .getBlock(Vector3Utils.add(ARENA_VECTOR_OFFSET, { x, y, z }))) === null || _a === void 0 ? void 0 : _a.setPermutation(BlockPermutation.resolve(blockType)); // Use the dynamic block type
    }
}
// Function to check if there are less blocks of a specific type in the arena and update spawn counters
export function checkForLessBlocks(ARENA_VECTOR_OFFSET, blockType // Accept block type to check for (e.g., "minecraft:diamond_block")
) {
    const blockCountThreshold = 100; // Set a threshold for block count to spawn new blocks
    // Check the arena area for missing blocks of the specified type
    let blocksInArena = 0;
    let missingBlocks = 0; // Track missing blocks
    for (let x = 0; x < 30; x++) {
        for (let z = 0; z < 30; z++) {
            const block = world
                .getDimension("overworld")
                .getBlock({ x: ARENA_VECTOR_OFFSET.x + x, y: ARENA_VECTOR_OFFSET.y, z: ARENA_VECTOR_OFFSET.z + z });
            if (block && block.type.id === blockType) {
                blocksInArena++;
            }
            else {
                missingBlocks++; // Count missing blocks (non-specified block type)
            }
        }
    }
    let spawnCountdown = 1; // Default spawn countdown
    if (blocksInArena < blockCountThreshold) {
        spawnCountdown = 5; // If there are fewer blocks, set a faster spawn rate
    }
    // Return updated values along with the missing blocks count
    return { spawnCountdown, missingBlocks };
}
//# sourceMappingURL=gameHelpers.js.map