import { world, DimensionLocation, Vector3, Player, BlockPermutation } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
/**
 * Set up the arena boundaries and structure.
 * @param arenaOffset The offset position for the arena
 * @param arenaSize Dimensions of the arena ({ x, y, z })
 */
export function setupArena(arenaLocation: Vector3, arenaSize: Vector3) {
  const dimension = world.getDimension(MinecraftDimensionTypes.Overworld);

  // Verify if the chunks at the arena's location are loaded
  const testBlock = dimension.getBlock({
    x: arenaLocation.x,
    y: arenaLocation.y,
    z: arenaLocation.z,
  });

  if (!testBlock) {
    console.warn("⚠️ Arena location is in an unloaded chunk. Ensure a player is nearby.");
    return;
  }

  // Proceed with creating the arena since the chunks are loaded
  createArena({
    xOffset: arenaLocation.x,
    yOffset: arenaLocation.y,
    zOffset: arenaLocation.z,
    xSize: arenaSize.x,
    ySize: arenaSize.y,
    zSize: arenaSize.z,
  });
}

interface ArenaDimensions {
  xOffset: number;
  yOffset: number;
  zOffset: number;
  xSize: number;
  ySize: number;
  zSize: number;
}

/**
 * Creates the arena structure with given parameters.
 * @param dimensions Arena creation parameters
 */
export function createArena(dimensions: ArenaDimensions) {
  let airBlockPerm = BlockPermutation.resolve("minecraft:air");
  let cobblestoneBlockPerm = BlockPermutation.resolve("minecraft:cobblestone");

  if (airBlockPerm) {
    fillBlock(
      airBlockPerm,
      dimensions.xOffset - dimensions.xSize / 2 + 1,
      dimensions.yOffset,
      dimensions.zOffset - dimensions.zSize / 2 + 1,
      dimensions.xOffset + dimensions.xSize / 2 - 1,
      dimensions.yOffset + dimensions.ySize,
      dimensions.zOffset + dimensions.zSize / 2 - 1
    );
  }

  if (cobblestoneBlockPerm) {
    fourWalls(
      cobblestoneBlockPerm,
      dimensions.xOffset - dimensions.xSize / 2,
      dimensions.yOffset,
      dimensions.zOffset - dimensions.zSize / 2,
      dimensions.xOffset + dimensions.xSize / 2,
      dimensions.yOffset + dimensions.ySize,
      dimensions.zOffset + dimensions.zSize / 2
    );
  }

  // Log arena creation
  console.warn(
    `Creating arena at offset (${dimensions.xOffset}, ${dimensions.yOffset}, ${dimensions.zOffset}) with size (${dimensions.xSize}, ${dimensions.ySize}, ${dimensions.zSize})`
  );
}

/**
 * Clear the arena by removing all non-player entities and filling the arena area with air.
 * @param arenaLowerCorner The lower-corner (starting coordinate) of the arena
 * @param arenaSize Dimensions of the arena
 */
export function clearArena(arenaLowerCorner: DimensionLocation, arenaSize: Vector3) {
  const { x, y, z, dimension } = arenaLowerCorner;

  // Validate arena size before proceeding.
  if (arenaSize.x <= 0 || arenaSize.y <= 0 || arenaSize.z <= 0) {
    world.sendMessage("⚠️ Invalid arena size. Please check dimensions.");
    return;
  }

  try {
    // Remove all non-player entities within the arena.
    const killCommand = `kill @e[type=!player,x=${x},y=${y},z=${z},dx=${arenaSize.x},dy=${arenaSize.y},dz=${arenaSize.z}]`;
    dimension.runCommand(killCommand);

    // Clear the area by filling it with air.
    const fillCommand = `fill ${x} ${y} ${z} ${x + arenaSize.x} ${y + arenaSize.y} ${z + arenaSize.z} air`;
    dimension.runCommand(fillCommand);

    // Notify success.
    world.sendMessage("🧹 Cleared the game arena and removed all entities!");
  } catch (error) {
    world.sendMessage(`⚠️ Failed to execute 'clearArena': ${error}`);
  }
}

/**
 * Calculate the arena center based on the arena's lower-corner.
 * @param arenaOffset The starting position for the arena calculations
 * @param arenaSize Dimensions of the arena
 * @returns The center position of the arena
 */
export function getArenaCenter(arenaLocation: Vector3, arenaSize: { x: number; y: number; z: number }): Vector3 {
  return {
    x: arenaLocation.x + arenaSize.x / 2 - 5,
    y: arenaLocation.y, // Example: Increase offset if players spawn underground
    z: arenaLocation.z + arenaSize.z / 2 - 5,
  };
}

/**
 * Teleport all players to the arena center.
 * @param players The players to teleport
 * @param arenaCenter The center position of the arena
 * @param dimension The dimension to teleport players to
 */
export function teleportPlayersToArena(players: Player[], arenaCenter: Vector3, dimension: any) {
  players.forEach((player) => {
    console.warn(`Teleporting ${player.name} to: x=${arenaCenter.x}, y=${arenaCenter.y}, z=${arenaCenter.z}`);
    player.teleport(arenaCenter, dimension);
    player.sendMessage("🚀 Teleporting you to the game area!");
  });
}

/**
 * Fill a region with blocks
 */
export function fillBlock(
  blockPerm: any,
  xFrom: number,
  yFrom: number,
  zFrom: number,
  xTo: number,
  yTo: number,
  zTo: number
): void {
  const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
  for (let i = xFrom; i <= xTo; i++) {
    for (let j = yFrom; j <= yTo; j++) {
      for (let k = zFrom; k <= zTo; k++) {
        const block = overworld.getBlock({ x: i, y: j, z: k });
        block?.setPermutation(blockPerm);
      }
    }
  }
}

export function fourWalls(
  perm: any,
  xFrom: number,
  yFrom: number,
  zFrom: number,
  xTo: number,
  yTo: number,
  zTo: number
): void {
  const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
  for (let i = xFrom; i <= xTo; i++) {
    for (let k = yFrom; k <= yTo; k++) {
      const block1 = overworld.getBlock({ x: i, y: k, z: zFrom });
      block1?.setPermutation(perm);

      const block2 = overworld.getBlock({ x: i, y: k, z: zTo });
      block2?.setPermutation(perm);
    }
  }
  for (let j = zFrom + 1; j < zTo; j++) {
    for (let k = yFrom; k <= yTo; k++) {
      const block3 = overworld.getBlock({ x: xFrom, y: k, z: j });
      block3?.setPermutation(perm);

      const block4 = overworld.getBlock({ x: xTo, y: k, z: j });
      block4?.setPermutation(perm);
    }
  }
}

export function clearChunk(x: number, z: number) {
  const dimension = world.getDimension(MinecraftDimensionTypes.Overworld);

  // Calculate chunk boundaries (aligned to 16x16 grid)
  const chunkXStart = Math.floor(x / 16) * 16;
  const chunkZStart = Math.floor(z / 16) * 16;
  const yStart = -64; // Bedrock edition lowest Y level
  const yEnd = 320; // Bedrock edition max Y level

  try {
    // Fill the chunk with air to clear it
    dimension.runCommand(
      `fill ${chunkXStart} ${yStart} ${chunkZStart} ${chunkXStart + 15} ${yEnd} ${chunkZStart + 15} air`
    );

    // Notify success
    console.warn(`✔️ Cleared chunk at (${chunkXStart}, ${yStart}, ${chunkZStart})`);
  } catch (error) {
    console.error(`⚠️ Failed to clear chunk: ${error}`);
  }
}
