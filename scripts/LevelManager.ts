import { world, system, BlockPermutation, Vector3, Dimension } from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import type { GameCore } from "./GameCore";
import { Vector3Utils } from "@minecraft/math";

export class LevelManager {
    private mobSpawnInterval?: number;
    
    constructor(private game: GameCore) {}

    initializeLevel() {
        try {
            const dimension = this.game.config.arenaLocation.dimension;
            this.placeRandomBlocks(dimension);
            this.spawnTargetBlock(dimension);
            
            // Spawn initial mobs
            this.spawnMobs(dimension);
            
            
        } catch (error) {
            console.error("Level initialization failed:", error);
        }
    }
    
    private placeRandomBlocks(dimension: Dimension) {
        const arena = this.game.config.arenaLocation;
        for (let i = 0; i < 15; i++) {
            const pos = this.randomArenaPosition();
            dimension.getBlock(pos)?.setPermutation(
                BlockPermutation.resolve(this.game.currentLevel.randomBlockToPlace)
            );
        }
    }

    private async spawnMobs(dimension: Dimension) {
        try {
            const arena = this.game.config.arenaLocation;
            
            // Spawn mobs
            const mobsToSpawn = [
                { type: MinecraftEntityTypes.Zombie, count: 3 },
                { type: MinecraftEntityTypes.Skeleton, count: 2 }
            ];
    
            for (const mob of mobsToSpawn) {
                for (let i = 0; i < mob.count; i++) {
                    const spawnPos = this.randomArenaPosition();
                    
                    try {
                        // Spawn the mob using proper Bedrock 1.21 syntax
                        await dimension.runCommandAsync(
                            `summon ${mob.type} ${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`
                        );
    
                        // Add equipment using proper Bedrock 1.21 syntax
                        if (mob.type === MinecraftEntityTypes.Zombie) {
                            await dimension.runCommandAsync(
                                `give @e[type=${mob.type},x=${spawnPos.x},y=${spawnPos.y},z=${spawnPos.z},r=1] iron_sword`
                            );
                        }
                        if (mob.type === MinecraftEntityTypes.Skeleton) {
                            await dimension.runCommandAsync(
                                `give @e[type=${mob.type},x=${spawnPos.x},y=${spawnPos.y},z=${spawnPos.z},r=1] bow`
                            );
                        }
                    } catch (error) {
                        console.warn(`Failed to spawn ${mob.type}:`, error);
                    }
                }
            }
    
        } catch (error) {
            console.error("Mob spawning failed:", error);
        }
    }
    
    public cleanup() {
        console.log("LevelManager cleanup");
        if (this.mobSpawnInterval) {
            console.log("Clearing mob spawn interval");
            system.clearRun(this.mobSpawnInterval);
            this.mobSpawnInterval = undefined;
        }
    }

    public spawnTargetBlock(dimension: Dimension) {
        try {
            const pos = this.randomArenaPosition();
            const block = dimension.getBlock(pos);
            
            if (block?.isValid()) {
                block.setPermutation(
                    BlockPermutation.resolve(this.game.currentLevel.blockToBreak)
                );
                console.log(`Successfully placed target block at ${JSON.stringify(pos)}`);
            } else {
                console.warn("Invalid block position for target block:", JSON.stringify(pos));
            }
        } catch (error) {
            console.error("Block spawn failed:", error);
        }
    }

    private randomArenaPosition(): Vector3 {
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        
        return {
            x: arena.x - Math.floor(size.x/2) + Math.floor(Math.random() * size.x),
            y: arena.y + 1 + Math.floor(Math.random() * (size.y - 2)), // Ensure Y stays within arena
            z: arena.z - Math.floor(size.z/2) + Math.floor(Math.random() * size.z)
        };
    }
}