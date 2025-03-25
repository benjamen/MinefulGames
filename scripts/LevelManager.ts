import { world, system, BlockPermutation, Vector3, Dimension, Block } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { BaseLevelManager } from "./BaseLevelManager";
import type { GameCore } from "./GameCore";

export class LevelManager extends BaseLevelManager {
    private mobSpawnInterval?: number;

    constructor(game: GameCore) {
        super(game);
    }

    initializeLevel() {
        try {
            const dimension = this.game.config.arenaLocation.dimension;
            this.clearArenaEntities(dimension);
            this.randomBlockPositions = [];
            
            this.placeRandomBlocks(dimension);
            this.spawnTargetBlock(dimension);
            this.spawnMobs(dimension);
        } catch (error) {
            console.error("Level initialization failed:", error);
        }
    }

    private async spawnMobs(dimension: Dimension) {
        try {
            await this.clearArenaEntities(dimension);
            const currentLevel = this.game.currentLevel;
            
            for (const mobConfig of currentLevel.mobsToSpawn) {
                const mobType = MinecraftEntityTypes[mobConfig.type as keyof typeof MinecraftEntityTypes];
                
                for (let i = 0; i < mobConfig.count; i++) {
                    const spawnPos = this.randomArenaPosition();
                    try {
                        await dimension.runCommandAsync(
                            `summon ${mobType} ${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`
                        );
                        await system.runTimeout(() => {}, 5);
                    } catch (error) {
                        console.warn(`Failed to spawn ${mobConfig.type}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error("Mob spawning failed:", error);
        }
    }

    private placeRandomBlocks(dimension: Dimension) {
        const blockType = this.game.currentLevel.randomBlockToPlace;
        const blockPlacementAttempts = 30;
        
        for (let i = 0; i < blockPlacementAttempts; i++) {
            const pos = this.randomArenaPosition();
            const block = dimension.getBlock(pos);
            
            if (block && this.isValidBlockPlacement(block)) {
                block.setPermutation(BlockPermutation.resolve(blockType));
                this.randomBlockPositions.push(pos);
                if (this.randomBlockPositions.length >= 15) break;
            }
        }
    }

    public spawnTargetBlock(dimension: Dimension) {
        if (this.isSpawningTargetBlock) return;
        this.isSpawningTargetBlock = true;
        
        try {
            if (this.currentTargetBlockPos) {
                const oldBlock = dimension.getBlock(this.currentTargetBlockPos);
                oldBlock?.setPermutation(BlockPermutation.resolve("air"));
            }

            const pos = this.randomArenaPosition();
            const block = dimension.getBlock(pos);
            
            if (block?.isValid()) {
                block.setPermutation(
                    BlockPermutation.resolve(this.game.currentLevel.blockToBreak)
                );
                this.currentTargetBlockPos = pos;
            }
        } catch (error) {
            console.error("Target block spawn failed:", error);
        } finally {
            this.isSpawningTargetBlock = false;
        }
    }

    cleanup() {
        if (this.mobSpawnInterval) system.clearRun(this.mobSpawnInterval);
        // Add game-specific cleanup if needed
    }

    preGameCleanup() {
        const dimension = this.game.config.arenaLocation.dimension;
        this.clearArenaEntities(dimension);
    }
}