import { Vector3 } from "@minecraft/server";
import { createArena } from "./createArena";

export function setupArena(arenaOffset: Vector3, arenaSize: Vector3) {
  // Pass the entire `arenaOffset` object, not just its individual properties.
  createArena({
  xOffset: arenaOffset.x,
  yOffset: arenaOffset.y,
  zOffset: arenaOffset.z,
  xSize: arenaSize.x,
  ySize: arenaSize.y,
  zSize: arenaSize.z,
});
}