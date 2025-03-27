import { DimensionLocation } from "@minecraft/server";
import { GameCore } from "../../GameCore";
import { MineTheDiamondsConfig, levelConfigurations } from "./config";

let isGameActive = false;

export function MineTheDiamonds(
  log: (message: string, status?: number) => void,
  defaultLocation: DimensionLocation,
  params?: string[]
) {
  if (isGameActive) {
    log("Game is already running", -1);
    return;
  }
  isGameActive = true;

  let arenaX = defaultLocation.x;
  let arenaY = defaultLocation.y;
  let arenaZ = defaultLocation.z;

  if (params && params.length >= 3) {
    const [x, y, z] = params.map(Number);
    if (!params.map(Number).some(isNaN)) {
      arenaX = x;
      arenaY = y;
      arenaZ = z;
      log(`Using custom location: ${arenaX}, ${arenaY}, ${arenaZ}`, 1);
    }
  }

  const game = new GameCore(
    {
      ...MineTheDiamondsConfig,
      levelConfigurations,
      arenaLocation: {
        x: arenaX,
        y: arenaY,
        z: arenaZ,
        dimension: defaultLocation.dimension,
      },
      lobbyLocation: {
        x: arenaX - 25,
        y: -60,
        z: arenaZ,
      },
      startingInventory: [
        { item: "minecraft:diamond_pickaxe", count: 1 },
        { item: "minecraft:dirt", count: 64 },
      ],
    },
    () => {
      isGameActive = false;
      log("Game ended", 1);
    }
  );

  game.startGame();
}
