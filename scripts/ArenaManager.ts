import { world, DimensionLocation, Player, BlockPermutation, Dimension, system } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";

const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);

interface ArenaDimensions {
  xOffset: number;
  yOffset: number;
  zOffset: number;
  xSize: number;
  ySize: number;
  zSize: number;
}

interface ArenaCreationOptions {
  includeWalls?: boolean;
  includeFloor?: boolean;
  includeRoof?: boolean;
  lighting?: boolean;
}

export function setupArena(
  arenaLocation: DimensionLocation,
  arenaSize: { x: number; y: number; z: number },
  options: ArenaCreationOptions
) {
  // Verify chunk loading
  const testBlock = overworld.getBlock({
    x: arenaLocation.x,
    y: arenaLocation.y,
    z: arenaLocation.z,
  });

  if (!testBlock) {
    console.warn("⚠️ Arena location is in an unloaded chunk. Ensure a player is nearby.");
    return false;
  }

  // Create with proper delays
  system.runTimeout(() => {
    createArena(
      {
        xOffset: arenaLocation.x,
        yOffset: arenaLocation.y,
        zOffset: arenaLocation.z,
        xSize: arenaSize.x,
        ySize: arenaSize.y,
        zSize: arenaSize.z,
      },
      options
    );
  }, 5); // 0.25 second delay

  return true;
}

export function createArena(dimensions: ArenaDimensions, options: ArenaCreationOptions) {
  // Phase 1: Clear space
  system.run(() => {
    fillBlock(
      BlockPermutation.resolve("minecraft:air"),
      dimensions.xOffset - dimensions.xSize / 2 + 1,
      dimensions.yOffset,
      dimensions.zOffset - dimensions.zSize / 2 + 1,
      dimensions.xOffset + dimensions.xSize / 2 - 1,
      dimensions.yOffset + dimensions.ySize,
      dimensions.zOffset + dimensions.zSize / 2 - 1
    );
  });

  // Phase 2: Build structures with delays
  const bedrockPerm = BlockPermutation.resolve("minecraft:bedrock");

  if (options.includeFloor) {
    system.runTimeout(() => {
      fillFloor(
        bedrockPerm,
        dimensions.xOffset - dimensions.xSize / 2,
        dimensions.yOffset,
        dimensions.zOffset - dimensions.zSize / 2,
        dimensions.xOffset + dimensions.xSize / 2,
        dimensions.zOffset + dimensions.zSize / 2
      );
    }, 10); // 0.5s delay
  }

  if (options.includeWalls) {
    system.runTimeout(() => {
      fourWalls(
        bedrockPerm,
        dimensions.xOffset - dimensions.xSize / 2,
        dimensions.yOffset,
        dimensions.zOffset - dimensions.zSize / 2,
        dimensions.xOffset + dimensions.xSize / 2,
        dimensions.yOffset + dimensions.ySize,
        dimensions.zOffset + dimensions.zSize / 2
      );
    }, 15); // 0.75s delay
  }

  if (options.includeRoof) {
    system.runTimeout(() => {
      fillRoof(
        bedrockPerm,
        dimensions.xOffset - dimensions.xSize / 2,
        dimensions.yOffset + dimensions.ySize,
        dimensions.zOffset - dimensions.zSize / 2,
        dimensions.xOffset + dimensions.xSize / 2,
        dimensions.zOffset + dimensions.zSize / 2
      );

      if (options.lighting) {
        addArenaLighting(
          dimensions.xOffset,
          dimensions.yOffset + dimensions.ySize - 1,
          dimensions.zOffset,
          dimensions.xSize,
          dimensions.zSize
        );
      }
    }, 20); // 1s delay
  }
}

export function clearArena(arenaLocation: DimensionLocation, arenaSize: { x: number; y: number; z: number }) {
  const { x, y, z, dimension } = arenaLocation;
  const startX = x - Math.floor(arenaSize.x / 2);
  const startZ = z - Math.floor(arenaSize.z / 2);
  const endX = x + Math.floor(arenaSize.x / 2);
  const endZ = z + Math.floor(arenaSize.z / 2);
  const endY = y + arenaSize.y;

  // Clear entities first
  dimension
    .getEntities({
      location: { x, y, z },
      maxDistance: Math.max(arenaSize.x, arenaSize.z),
    })
    .forEach((entity) => {
      if (!(entity instanceof Player)) entity.kill();
    });

  // Then clear blocks with command
  dimension.runCommandAsync(`fill ${startX} ${y} ${startZ} ${endX} ${endY} ${endZ} air`).catch(console.error);
}

// Utility functions with error handling
function fillBlock(
  blockPerm: BlockPermutation,
  xFrom: number,
  yFrom: number,
  zFrom: number,
  xTo: number,
  yTo: number,
  zTo: number
) {
  try {
    for (let x = xFrom; x <= xTo; x++) {
      for (let y = yFrom; y <= yTo; y++) {
        for (let z = zFrom; z <= zTo; z++) {
          overworld.getBlock({ x, y, z })?.setPermutation(blockPerm);
        }
      }
    }
  } catch (error) {
    console.error("Fill block error:", error);
  }
}

function fillFloor(blockPerm: BlockPermutation, xFrom: number, y: number, zFrom: number, xTo: number, zTo: number) {
  fillBlock(blockPerm, xFrom, y, zFrom, xTo, y, zTo);
}

function fillRoof(blockPerm: BlockPermutation, xFrom: number, y: number, zFrom: number, xTo: number, zTo: number) {
  fillBlock(blockPerm, xFrom, y, zFrom, xTo, y, zTo);
}

function fourWalls(
  blockPerm: BlockPermutation,
  xFrom: number,
  yFrom: number,
  zFrom: number,
  xTo: number,
  yTo: number,
  zTo: number
) {
  // North/South walls
  for (let x = xFrom; x <= xTo; x++) {
    for (let y = yFrom; y <= yTo; y++) {
      overworld.getBlock({ x, y, z: zFrom })?.setPermutation(blockPerm);
      overworld.getBlock({ x, y, z: zTo })?.setPermutation(blockPerm);
    }
  }

  // East/West walls
  for (let z = zFrom + 1; z < zTo; z++) {
    for (let y = yFrom; y <= yTo; y++) {
      overworld.getBlock({ x: xFrom, y, z })?.setPermutation(blockPerm);
      overworld.getBlock({ x: xTo, y, z })?.setPermutation(blockPerm);
    }
  }
}

function addArenaLighting(centerX: number, yLevel: number, centerZ: number, sizeX: number, sizeZ: number) {
  const spacing = 5;
  for (let x = centerX - Math.floor(sizeX / 2); x <= centerX + Math.floor(sizeX / 2); x += spacing) {
    for (let z = centerZ - Math.floor(sizeZ / 2); z <= centerZ + Math.floor(sizeZ / 2); z += spacing) {
      overworld.getBlock({ x, y: yLevel, z })?.setPermutation(BlockPermutation.resolve("minecraft:glowstone"));
    }
  }
}

export function teleportPlayersToArena(
  players: Player[],
  arenaCenter: { x: number; y: number; z: number },
  dimension: Dimension
) {
  players.forEach((player) => {
    try {
      if (player.isValid()) {
        player.teleport({ x: arenaCenter.x, y: arenaCenter.y + 2, z: arenaCenter.z }, { dimension });
      }
    } catch (error) {
      console.error("Teleport failed:", error);
    }
  });
}
