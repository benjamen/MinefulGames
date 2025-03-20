import { world, DimensionLocation } from "@minecraft/server";

/**
 * Set up the arena boundaries and structure.
 * @param arenaLocation The offset position for the arena ({ x, y, z })
 * @param arenaSize Dimensions of the arena ({ x, y, z })
 */
export function setupArena(
  arenaLocation: { x: number; y: number; z: number },
  arenaSize: { x: number; y: number; z: number }
) {
  world.sendMessage("🌍 Setting up arena...");
  // TODO: Add arena setup logic (e.g., clearing, barriers, decorations)
}

/**
 * Clear the arena by removing all non-player entities and filling the arena area with air.
 * @param arenaLowerCorner The lower-corner (starting coordinate) of the arena
 * @param arenaSize Dimensions of the arena ({ x, y, z })
 */
export function clearArena(arenaLowerCorner: DimensionLocation, arenaSize: { x: number; y: number; z: number }) {
  world.sendMessage("🧹 Clearing arena...");

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
 * Teleport all players to the arena center.
 * @param players The players to teleport
 * @param location The center position of the arena ({ x, y, z })
 * @param dimension The dimension to teleport players to
 */
export function teleportPlayersToArena(
  players: any[],
  location: { x: number; y: number; z: number },
  dimension: string
) {
  const targetDimension = world.getDimension(dimension);
  players.forEach((player) => {
    player.teleport(location, { dimension: targetDimension });
    player.sendMessage("🚀 Teleporting you to the game area!");
  });
}
