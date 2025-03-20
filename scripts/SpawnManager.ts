import { world, BlockPermutation } from "@minecraft/server";

export function spawnMobsWithinArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  mobType: string
) {
  try {

    const overworld = world.getDimension("overworld");
    const count = Math.floor(Math.random() * 2) + 1; // Spawn 1-2 mobs

    for (let i = 0; i < count; i++) {
      const x = arenaLocation.x + Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2);
      const y = arenaLocation.y + Math.floor(Math.random() * arenaSize.y);
      const z = arenaLocation.z + Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2);

      const mobSpawnLocation = { x, y, z };

      // Spawn the mob directly without checking the block below
      overworld.spawnEntity(mobType, mobSpawnLocation);

    }
  } catch (error) {
    console.error("Error spawning mob:", error);
  }
}

export function spawnBlockWithinArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  blockType: string
) {
  try {


    const overworld = world.getDimension("overworld");

    // Calculate random coordinates within the arena boundaries
    const x = arenaLocation.x + Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2);
    const y = arenaLocation.y + Math.floor(Math.random() * arenaSize.y);
    const z = arenaLocation.z + Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2);

    const blockSpawnLocation = { x, y, z };

    // Set the block at the computed location
    const blockPermutation = BlockPermutation.resolve(blockType);
    if (!blockPermutation) {
      console.error(`Failed to resolve block type: ${blockType}`);
      return;
    }

    const block = overworld.getBlock(blockSpawnLocation);
    if (block) {
      block.setPermutation(blockPermutation);
    } else {
      console.warn("Failed to retrieve block at spawn location:", blockSpawnLocation);
    }
  } catch (error) {
    console.error("Error in spawnBlockWithinArena:", error);
  }
}

export function placeRandomBlocksWithinArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  blockType: string = "minecraft:leaves"
) {
  try {

    const overworld = world.getDimension("overworld");

    for (let i = 0; i < 10; i++) {
      // Place 10 random blocks
      const x = arenaLocation.x + Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2);
      const y = arenaLocation.y + Math.floor(Math.random() * arenaSize.y);
      const z = arenaLocation.z + Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2);

      const randomBlockLocation = { x, y, z };

      const blockPermutation = BlockPermutation.resolve(blockType);
      if (!blockPermutation) {
        console.error(`Failed to resolve block type: ${blockType}`);
        continue;
      }

      const block = overworld.getBlock(randomBlockLocation);
      if (block) {
        block.setPermutation(blockPermutation);
      } else {
        console.warn("Failed to retrieve block at spawn location:", randomBlockLocation);
      }
    }
  } catch (error) {
    console.error("Error placing block:", error);
  }
}
