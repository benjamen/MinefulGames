import { system, Dimension } from "@minecraft/server";
import { GameLevelManager } from "../../GameLevelManager";

export class MineTheDiamondsLevelManager extends GameLevelManager {
    private mobSpawnIntervals: number[] = [];
    private currentTargetBlock?: { x: number; y: number; z: number };

    initializeLevel() {
        const dimension = this.game.config.arenaLocation.dimension;
        this.clearArenaEntities(dimension);
        this.spawnInitialBlocks();
        this.spawnMobs();
    }

    private spawnInitialBlocks() {
        const { dimension, x, y, z } = this.game.config.arenaLocation;
        
        // Spawn random decorative blocks
        this.spawnRandomBlocks();
        
        // Spawn first target block
        this.spawnNewTargetBlock();
    }

   // In MineTheDiamondsLevelManager.ts - spawnNewTargetBlock()
// In MineTheDiamondsLevelManager.ts - spawnNewTargetBlock()
// In MineTheDiamondsLevelManager.ts - Modified spawnNewTargetBlock()
// In MineTheDiamondsLevelManager.ts - Modify spawnNewTargetBlock()
private spawnNewTargetBlock() {
    system.runTimeout(() => {
        const pos = this.getRandomArenaPosition();
        const dimension = this.game.config.arenaLocation.dimension;
        
        dimension.runCommandAsync(
            `setblock ${pos.x} ${pos.y} ${pos.z} ${this.game.currentLevel.blockToBreak}`
        );
        this.currentTargetBlock = pos;
    }, 20); // 1 second delay after arena clear
}

    // In MineTheDiamondsLevelManager.ts - Update spawnRandomBlocks()
    private spawnRandomBlocks() {
        const { dimension } = this.game.config.arenaLocation;
        const blockType = this.game.currentLevel.randomBlockToPlace;
        if (!blockType) return;

        // Use command-based placement with proper delays
        for (let i = 0; i < 20; i++) {
            system.runTimeout(() => {
                const pos = this.getRandomArenaPosition();
                dimension.runCommandAsync(
                    `setblock ${pos.x} ${pos.y} ${pos.z} ${blockType}`
                );
            }, i * 2); // Stagger placements
        }
    }

    // In MineTheDiamondsLevelManager.ts - getRandomArenaPosition()
    private getRandomArenaPosition() {
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        return {
            x: arena.x + (Math.random() * size.x - size.x/2),
            y: arena.y + 1 + Math.floor(Math.random() * (size.y - 2)), // Random Y within arena height
            z: arena.z + (Math.random() * size.z - size.z/2)
        };
    }

    private spawnMobs() {
        const mobs = this.game.currentLevel.customData?.mobsToSpawn || [];
        const { dimension } = this.game.config.arenaLocation;

        mobs.forEach((mob: { type: string; count: number }) => {
            const interval = system.runInterval(() => {
                for (let i = 0; i < mob.count; i++) {
                    const pos = this.getRandomArenaPosition();
                    dimension.runCommandAsync(
                        `summon minecraft:${mob.type} ${pos.x} ${pos.y} ${pos.z}`
                    );
                }
            }, 200);
            this.mobSpawnIntervals.push(interval);
        });
    }

    public handleBlockBroken() {
        this.spawnNewTargetBlock();
    }

    cleanup() {
        // Clear mobs
        this.mobSpawnIntervals.forEach(interval => system.clearRun(interval));
        
        // Clear blocks using commands
        const { dimension, x, y, z } = this.game.config.arenaLocation;
        dimension.runCommandAsync(`fill ${x-15} ${y-5} ${z-15} ${x+15} ${y+5} ${z+15} air`);
    }

    preGameCleanup() {
        this.clearArenaEntities(this.game.config.arenaLocation.dimension);
    }
}