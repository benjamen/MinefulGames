import { createArena } from "./createArena";
export function setupArena(location, arenaOffset, arenaSize) {
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
//# sourceMappingURL=arenaUtils.js.map