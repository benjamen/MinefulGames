import { system, Dimension } from "@minecraft/server";
import { GameLevelManager } from "../../GameLevelManager";

export class ZombieSurvivalLevelManager extends GameLevelManager {
    private mobSpawnInterval?: number;

    initializeLevel() {
        try {
            const dimension = this.game.config.arenaLocation.dimension;
            this.clearArenaEntities(dimension);
            this.startZombieWaves();
        } catch (error) {
            console.error("Level initialization failed:", error);
        }
    }

    private startZombieWaves() {
        const waveConfig = this.game.currentLevel.customData?.mobsToSpawn;
        if (!waveConfig) return;

        const dimension = this.game.config.arenaLocation.dimension;
        this.mobSpawnInterval = system.runInterval(() => {
            this.spawnZombieWave(dimension, waveConfig);
        }, 1000); // Default to 1000ms spawn interval
    }

    private spawnZombieWave(dimension: Dimension, waveConfig: any) {
        for (const mob of waveConfig) {
            for (let i = 0; i < mob.count; i++) {
                const zombieType = mob.type;
                const spawnPos = this.randomArenaPosition(); // Now uses inherited method
                
                try {
                    dimension.spawnEntity(`minecraft:${zombieType.toLowerCase()}`, spawnPos);
                } catch (error) {
                    console.warn(`Failed to spawn ${zombieType}:`, error);
                }
            }
        }
    }

    cleanup() {
        if (this.mobSpawnInterval) {
            system.clearRun(this.mobSpawnInterval);
        }
    }

    preGameCleanup() {
        this.clearArenaEntities(this.game.config.arenaLocation.dimension);
    }
}