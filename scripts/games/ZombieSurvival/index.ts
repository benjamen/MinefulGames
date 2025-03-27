import { DimensionLocation } from "@minecraft/server";
import { GameCore } from "../../GameCore";
import { ZombieSurvivalConfig, levelConfigurations } from "./config";

let isGameActive = false;

export function ZombieSurvival(
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

    const game = new GameCore({
        ...ZombieSurvivalConfig,
        levelConfigurations: levelConfigurations.map(level => ({
            description: level.description,
            gameTime: level.gameTime,
            customData: {
                mobsToSpawn: level.customData.zombieWave.types.map(type => ({
                    type,
                    count: level.customData.zombieWave.count
                }))
            }
        })),
        arenaLocation: {
            x: arenaX,
            y: arenaY,
            z: arenaZ,
            dimension: defaultLocation.dimension
        },
        lobbyLocation: {
            x: arenaX,
            y: -60,
            z: arenaZ
        },
        startingInventory: [
            { item: "minecraft:iron_sword", count: 1 },
            { item: "minecraft:shield", count: 1 },
            { item: "minecraft:cooked_beef", count: 16 }
        ]
    }, () => {
        isGameActive = false;
        log("Game ended", 1);
    });

    game.startGame();
}