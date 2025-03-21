// ArenaHelper.ts
import { Dimension } from "@minecraft/server";

export function getArenaCenter(arenaLocation: { x: number; y: number; z: number }) {
    return {
        x: arenaLocation.x,
        y: arenaLocation.y + 3, // One block above the floor
        z: arenaLocation.z,
    };
}

export function getArenaLowerCorner(
    arenaLocation: { x: number; y: number; z: number },
    arenaSize: { x: number; z: number },
    dimension: Dimension
) {
    return {
        x: arenaLocation.x - Math.floor(arenaSize.x / 2),
        y: arenaLocation.y,
        z: arenaLocation.z - Math.floor(arenaSize.z / 2),
        dimension: dimension,
    };
}