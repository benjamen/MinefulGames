import { world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";

export default class Utilities {
    static fillBlock(
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

    static fourWalls(
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
}
