import { Vector3 } from "@minecraft/server";
import { createArena } from "./createArena";

export function setupArena(location: any, arenaOffset: Vector3, arenaSize: { x: number; y: number; z: number }) {
  // This allows DimensionLocation to be passed
  createArena({
    xOffset: arenaOffset.x,
    yOffset: arenaOffset.y,
    zOffset: arenaOffset.z,
    xSize: arenaSize.x,
    ySize: arenaSize.y,
    zSize: arenaSize.z,
  });
}
