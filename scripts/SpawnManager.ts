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
      // Adjust spawning area to be one block inside the walls, floor, and roof
      const x = arenaLocation.x + Math.floor(Math.random() * (arenaSize.x - 2)) - Math.floor(arenaSize.x / 2) + 1;
      const y = arenaLocation.y + Math.floor(Math.random() * (arenaSize.y - 2)) + 1; // One block above the floor
      const z = arenaLocation.z + Math.floor(Math.random() * (arenaSize.z - 2)) - Math.floor(arenaSize.z / 2) + 1;

      const mobSpawnLocation = { x, y, z };

      // Spawn the mob directly without checking the block below
      overworld.spawnEntity(mobType, mobSpawnLocation);
    }
  } catch (error) {
    console.error("Error spawning mob:", error);
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
      // Adjust spawning area to be one block inside the walls, floor, and roof
      const x = arenaLocation.x + Math.floor(Math.random() * (arenaSize.x - 2)) - Math.floor(arenaSize.x / 2) + 1;
      const y = arenaLocation.y + Math.floor(Math.random() * (arenaSize.y - 2)) + 2; // One block above the floor
      const z = arenaLocation.z + Math.floor(Math.random() * (arenaSize.z - 2)) - Math.floor(arenaSize.z / 2) + 1;

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
export function spawnBlockWithinArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  blockType: string
) {
  try {
    const overworld = world.getDimension("overworld");

    // Adjust spawning area to be one block inside the walls, floor, and roof
    const x = arenaLocation.x + Math.floor(Math.random() * (arenaSize.x - 2)) - Math.floor(arenaSize.x / 2) + 1;
    const y = arenaLocation.y + Math.floor(Math.random() * (arenaSize.y - 2)) + 1; // One block above the floor
    const z = arenaLocation.z + Math.floor(Math.random() * (arenaSize.z - 2)) - Math.floor(arenaSize.z / 2) + 1;

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