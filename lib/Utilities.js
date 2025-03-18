import { world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
export default class Utilities {
    static fillBlock(blockPerm, xFrom, yFrom, zFrom, xTo, yTo, zTo) {
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        for (let i = xFrom; i <= xTo; i++) {
            for (let j = yFrom; j <= yTo; j++) {
                for (let k = zFrom; k <= zTo; k++) {
                    const block = overworld.getBlock({ x: i, y: j, z: k });
                    block === null || block === void 0 ? void 0 : block.setPermutation(blockPerm);
                }
            }
        }
    }
    static fourWalls(perm, xFrom, yFrom, zFrom, xTo, yTo, zTo) {
        const overworld = world.getDimension(MinecraftDimensionTypes.Overworld);
        for (let i = xFrom; i <= xTo; i++) {
            for (let k = yFrom; k <= yTo; k++) {
                const block1 = overworld.getBlock({ x: i, y: k, z: zFrom });
                block1 === null || block1 === void 0 ? void 0 : block1.setPermutation(perm);
                const block2 = overworld.getBlock({ x: i, y: k, z: zTo });
                block2 === null || block2 === void 0 ? void 0 : block2.setPermutation(perm);
            }
        }
        for (let j = zFrom + 1; j < zTo; j++) {
            for (let k = yFrom; k <= yTo; k++) {
                const block3 = overworld.getBlock({ x: xFrom, y: k, z: j });
                block3 === null || block3 === void 0 ? void 0 : block3.setPermutation(perm);
                const block4 = overworld.getBlock({ x: xTo, y: k, z: j });
                block4 === null || block4 === void 0 ? void 0 : block4.setPermutation(perm);
            }
        }
    }
}
//# sourceMappingURL=Utilities.js.map