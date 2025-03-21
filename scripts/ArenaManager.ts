import { world, DimensionLocation, Player, BlockPermutation } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { Vector3Utils } from "@minecraft/math";

const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);

// Define the ArenaDimensions interface
interface ArenaDimensions {
  xOffset: number;
  yOffset: number;
  zOffset: number;
  xSize: number;
  ySize: number;
  zSize: number;
}

/**
 * Set up the arena boundaries and structure.
 * @param arenaLocation The offset position for the arena ({ x, y, z })
 * @param arenaSize Dimensions of the arena ({ x, y, z })
 */
export function setupArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number },
  options: {
    includeWalls?: boolean;
    includeFloor?: boolean;
    includeRoof?: boolean;
  } = { includeWalls: true, includeFloor: true, includeRoof: true } // Default to including all components
) {
  // Verify if the chunks at the arena's location are loaded
  const testBlock = overworld.getBlock({
    x: arenaLocation.x,
    y: arenaLocation.y,
    z: arenaLocation.z,
  });

  if (!testBlock) {
    console.warn("⚠️ Arena location is in an unloaded chunk. Ensure a player is nearby.");
    return;
  }

  // Proceed with creating the arena since the chunks are loaded
  createArena(
    {
      xOffset: arenaLocation.x,
      yOffset: arenaLocation.y,
      zOffset: arenaLocation.z,
      xSize: arenaSize.x,
      ySize: arenaSize.y,
      zSize: arenaSize.z,
    },
    options // Pass the options to createArena
  );
}
/**
 * Creates the arena structure with given parameters.
 * @param dimensions Arena creation parameters
 */
export function createArena(
  dimensions: ArenaDimensions,
  options: {
    includeWalls?: boolean;
    includeFloor?: boolean;
    includeRoof?: boolean;
  }
) {
  let airBlockPerm = BlockPermutation.resolve("minecraft:air");
  let cobblestoneBlockPerm = BlockPermutation.resolve("minecraft:cobblestone");

  // Clear the space inside the arena
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

  // Create the floor (if enabled)
  if (cobblestoneBlockPerm && options.includeFloor) {
    fillFloor(
      cobblestoneBlockPerm,
      dimensions.xOffset - dimensions.xSize / 2,
      dimensions.yOffset, // Floor starts at yOffset
      dimensions.zOffset - dimensions.zSize / 2,
      dimensions.xOffset + dimensions.xSize / 2,
      dimensions.zOffset + dimensions.zSize / 2
    );
  }

  // Create the four walls (if enabled)
  if (cobblestoneBlockPerm && options.includeWalls) {
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

  // Create the roof (if enabled)
  if (cobblestoneBlockPerm && options.includeRoof) {
    fillRoof(
      cobblestoneBlockPerm,
      dimensions.xOffset - dimensions.xSize / 2,
      dimensions.yOffset + dimensions.ySize, // Roof starts at yOffset + ySize
      dimensions.zOffset - dimensions.zSize / 2,
      dimensions.xOffset + dimensions.xSize / 2,
      dimensions.zOffset + dimensions.zSize / 2
    );
  }
}
/**
 * Clear the arena by removing all non-player entities and filling the arena area with air.
 * @param arenaLowerCorner The lower-corner (starting coordinate) of the arena
 * @param arenaSize Dimensions of the arena ({ x, y, z })
 */
/**
 * Clear the arena by removing all non-player entities and filling the arena area with air.
 * @param arenaLowerCorner The lower-corner (starting coordinate) of the arena
 * @param arenaSize Dimensions of the arena ({ x, y, z })
 */
export function clearArena(arenaLowerCorner: DimensionLocation, arenaSize: { x: number; y: number; z: number }) {
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


  } catch (error) {
    console.error(`⚠️ Failed to execute 'clearArena': ${error}`);
    world.sendMessage(`⚠️ Failed to clear arena: ${error}`);
  }
}


/**
 * Teleport all players to the arena center.
 * @param players The players to teleport
 * @param arenaCenter The center position of the arena ({ x, y, z })
 * @param dimension The dimension to teleport players to
 */

export function teleportPlayersToArena(
  players: Player[],
  arenaCenter: { x: number; y: number; z: number },
  dimension: string
) {
  try {

    players.forEach((player) => {
      if (player && player.isValid()) {
        player.teleport(arenaCenter, { dimension: overworld });
        player.sendMessage("🚀 Teleporting you to the game area!");
      } else {
        console.warn("Invalid player:", player);
      }
    });
  } catch (error) {
    console.error("Error teleporting players to arena:", error);
  }
}

export function teleportPlayersToLobby(
  players: Player[],
  lobbyLocation: { x: number; y: number; z: number },
  dimension: string
) {
  try {

    players.forEach((player) => {
      if (player && player.isValid()) {
        player.teleport(lobbyLocation, { dimension: overworld });
        player.sendMessage("🚀 Teleporting you to the Lobby!");
      } else {
        console.warn("Invalid player:", player);
      }
    });
  } catch (error) {
    console.error("Error teleporting players to arena:", error);
  }
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

export function fillFloor(
  blockPerm: any,
  xFrom: number,
  yFloor: number, // The y-coordinate where the floor starts
  zFrom: number,
  xTo: number,
  zTo: number
): void {
  // Fill the floor from yFloor downwards (adjust yFrom and yTo as needed)
  fillBlock(blockPerm, xFrom, yFloor, zFrom, xTo, yFloor, zTo);
}

export function fillRoof(
  blockPerm: any,
  xFrom: number,
  yRoof: number, // The y-coordinate where the roof starts
  zFrom: number,
  xTo: number,
  zTo: number
): void {
  // Fill the roof from yRoof upwards (adjust yFrom and yTo as needed)
  fillBlock(blockPerm, xFrom, yRoof, zFrom, xTo, yRoof, zTo);
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

  } catch (error) {
    console.error(`⚠️ Failed to clear chunk: ${error}`);
  }
}
