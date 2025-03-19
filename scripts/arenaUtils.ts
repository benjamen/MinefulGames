import { createArena } from "./createArena";
import { Vector3 } from "@minecraft/server";

export function setupArena(location: Vector3, arenaOffset: Vector3, arenaSize: { x: number; y: number; z: number }) {
  createArena({
    xOffset: arenaOffset.x,
    yOffset: arenaOffset.y,
    zOffset: arenaOffset.z,
    xSize: arenaSize.x,
    ySize: arenaSize.y,
    zSize: arenaSize.z,
  });
}
