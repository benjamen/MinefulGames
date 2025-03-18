import { world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
export default class Utilities {
    static fillBlock(blockPerm, xFrom, yFrom, zFrom, xTo, yTo, zTo) {
        var _a;
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        for (let i = xFrom; i <= xTo; i++) {
            for (let j = yFrom; j <= yTo; j++) {
                for (let k = zFrom; k <= zTo; k++) {
                    (_a = overworld.getBlock({ x: i, y: j, z: k })) === null || _a === void 0 ? void 0 : _a.setPermutation(blockPerm);
                }
            }
        }
    }
    static fourWalls(perm, xFrom, yFrom, zFrom, xTo, yTo, zTo) {
        var _a, _b, _c, _d;
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        for (let i = xFrom; i <= xTo; i++) {
            for (let k = yFrom; k <= yTo; k++) {
                (_a = overworld.getBlock({ x: i, y: k, z: zFrom })) === null || _a === void 0 ? void 0 : _a.setPermutation(perm);
                (_b = overworld.getBlock({ x: i, y: k, z: zTo })) === null || _b === void 0 ? void 0 : _b.setPermutation(perm);
            }
        }
        for (let j = zFrom + 1; j < zTo; j++) {
            for (let k = yFrom; k <= yTo; k++) {
                (_c = overworld.getBlock({ x: xFrom, y: k, z: j })) === null || _c === void 0 ? void 0 : _c.setPermutation(perm);
                (_d = overworld.getBlock({ x: xTo, y: k, z: j })) === null || _d === void 0 ? void 0 : _d.setPermutation(perm);
            }
        }
    }
}
//# sourceMappingURL=Utilities.js.map