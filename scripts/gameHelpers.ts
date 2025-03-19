import { world, BlockPermutation, Vector3 } from "@minecraft/server";

// Function to spawn a block within the arena
export function spawnBlockWithinArena(
  arenaLocation: Vector3,
  arenaSize: { x: number; y: number; z: number },
  blockType: string // Block type to spawn
) {
  const overworld = world.getDimension("overworld");

  // Generate random coordinates within the arena bounds
  const x = Math.floor(Math.random() * arenaSize.x) - Math.floor(arenaSize.x / 2) + arenaLocation.x;
  const y = Math.floor(Math.random() * arenaSize.y) + arenaLocation.y; // Use the y size for height
  const z = Math.floor(Math.random() * arenaSize.z) - Math.floor(arenaSize.z / 2) + arenaLocation.z;

  // Rename blockLocation to avoid redeclaration
  const blockSpawnLocation = { x, y, z }; // This is now the unique variable name

  // Send a message to confirm the block creation location
  world.sendMessage(
    `Creating new ${blockType} at ${blockSpawnLocation.x}, ${blockSpawnLocation.y}, ${blockSpawnLocation.z}`
  );

  // Set the block at the chosen location
  const blockPermutation = BlockPermutation.resolve(blockType);
  overworld.getBlock(blockSpawnLocation)?.setPermutation(blockPermutation);
}

// Function to spawn mobs within the arena
export function spawnMobsWithinArena(
  arenaLocation: Vector3,
  arenaSize: { x: number; y: number; z: number },
  mobType: string // Mob type to spawn
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
    } else {
      console.warn(`Invalid mob type: ${mobType}`);
    }
  }
}

// Function to place random blocks within the arena
export function placeRandomBlocksWithinArena(
  arenaLocation: Vector3,
  arenaSize: { x: number; y: number; z: number },
  blockType: string = "minecraft:leaves" // Default to "minecraft:leaves", but can be changed
) {
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
    overworld.getBlock(randomBlockLocation)?.setPermutation(blockPermutation); // Use the dynamic block type
  }
}
