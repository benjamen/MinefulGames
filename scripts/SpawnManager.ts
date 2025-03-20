import { world, BlockPermutation } from "@minecraft/server";

export function spawnBlockWithinArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  blockType: string
) {
  try {
    console.log("Spawn Block Function Triggered");
    console.log(`Arena Location: ${JSON.stringify(arenaLocation)}, Arena Size: ${JSON.stringify(arenaSize)}`);
    console.log(`Block Type: ${blockType}`);

    const overworld = world.getDimension("overworld");

    // Calculate random coordinates within the arena boundaries
    const x = arenaLocation.x + Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2);
    const y = arenaLocation.y + Math.floor(Math.random() * arenaSize.y);
    const z = arenaLocation.z + Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2);

    console.log(`Computed Block Coordinates: ${x}, ${y}, ${z}`);
    const blockSpawnLocation = { x, y, z };

    // Set the block at the computed location
    const blockPermutation = BlockPermutation.resolve(blockType);
    const block = overworld.getBlock(blockSpawnLocation);
    if (block) {
      block.setPermutation(blockPermutation);
      console.log("Block placed successfully.");
    } else {
      console.warn("Failed to retrieve block at spawn location:", blockSpawnLocation);
    }
  } catch (error) {
    console.error("Error in spawnBlockWithinArena:", error);
  }
}

// Function to spawn mobs within the arena

export function spawnMobsWithinArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  mobType: string
) {
  try {
    console.log("Spawn Mobs Function Triggered");
    console.log(
      `Mob Type: ${mobType}, Arena Location: ${JSON.stringify(arenaLocation)}, Arena Size: ${JSON.stringify(arenaSize)}`
    );

    const overworld = world.getDimension("overworld");
    const count = Math.floor(Math.random() * 2) + 1; // Spawn 1-2 mobs
    console.log(`Spawning ${count} mobs...`);

    for (let i = 0; i < count; i++) {
      const x = arenaLocation.x + Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2);
      const y = arenaLocation.y + Math.floor(Math.random() * arenaSize.y);
      const z = arenaLocation.z + Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2);

      const mobSpawnLocation = { x, y, z };
      console.log(`Attempting to spawn mob at: ${JSON.stringify(mobSpawnLocation)}`);

      overworld.spawnEntity(mobType, mobSpawnLocation);
      console.log(`Mob ${mobType} spawned successfully.`);
    }
  } catch (error) {
    console.error("Error spawning mob:", error);
  }
}

// Function to place random blocks within the arena

export function placeRandomBlocksWithinArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  blockType: string = "minecraft:leaves"
) {
  try {
    console.log("Place Random Blocks Function Triggered");
    console.log(
      `Block Type: ${blockType}, Arena Location: ${JSON.stringify(arenaLocation)}, Arena Size: ${JSON.stringify(
        arenaSize
      )}`
    );

    const overworld = world.getDimension("overworld");

    for (let i = 0; i < 10; i++) {
      // Place 10 random blocks
      const x = arenaLocation.x + Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2);
      const y = arenaLocation.y + Math.floor(Math.random() * arenaSize.y);
      const z = arenaLocation.z + Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2);

      const randomBlockLocation = { x, y, z };
      console.log(`Placing block at: ${JSON.stringify(randomBlockLocation)}`);

      const blockPermutation = BlockPermutation.resolve(blockType);
      overworld.getBlock(randomBlockLocation)?.setPermutation(blockPermutation);
      console.log("Block placed successfully.");
    }
  } catch (error) {
    console.error("Error placing block:", error);
  }
}
