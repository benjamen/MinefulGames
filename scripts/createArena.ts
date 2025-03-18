import { BlockPermutation } from "@minecraft/server";
import Utilities from "./Utilities.js";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";

interface ArenaDimensions {
  xOffset: number;
  yOffset: number;
  zOffset: number;
  xSize: number;
  ySize: number;
  zSize: number;
}

export function createArena(dimensions: ArenaDimensions) {
  let airBlockPerm = BlockPermutation.resolve(MinecraftBlockTypes.Air);
  let cobblestoneBlockPerm = BlockPermutation.resolve(MinecraftBlockTypes.Cobblestone);

  if (airBlockPerm) {
    Utilities.fillBlock(
      airBlockPerm,
      dimensions.xOffset - dimensions.xSize / 2 + 1,
      dimensions.yOffset,
      dimensions.zOffset - dimensions.zSize / 2 + 1,
      dimensions.xOffset + dimensions.xSize / 2 - 1,
      dimensions.yOffset + dimensions.ySize,
      dimensions.zOffset + dimensions.zSize / 2 - 1
    );
  }

  if (cobblestoneBlockPerm) {
    Utilities.fourWalls(
      cobblestoneBlockPerm,
      dimensions.xOffset - dimensions.xSize / 2,
      dimensions.yOffset,
      dimensions.zOffset - dimensions.zSize / 2,
      dimensions.xOffset + dimensions.xSize / 2,
      dimensions.yOffset + dimensions.ySize,
      dimensions.zOffset + dimensions.zSize / 2
    );
  }
}
