import { world, system, BlockPermutation, Vector3, Dimension } from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import type { GameCore } from "./GameCore";
import { Vector3Utils } from "@minecraft/math";

export class LevelManager {
    private mobSpawnInterval?: number;
    private currentTargetBlockPos: Vector3 | undefined; // Add this property
    
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
            
            // Get mob configuration from the current level
            const currentLevel = this.game.currentLevel;
            const mobTypeKey = currentLevel.mobToSpawn as keyof typeof MinecraftEntityTypes;
            const mobType = MinecraftEntityTypes[mobTypeKey];
            const mobCount = currentLevel.mobCount; // Use mobCount from level configuration
    
            const mobsToSpawn = [
                { type: mobType, count: mobCount }
            ];
    
            for (const mob of mobsToSpawn) {
                for (let i = 0; i < mob.count; i++) {
                    const spawnPos = this.randomArenaPosition();
                    
                    try {
                        // Spawn the mob
                        await dimension.runCommandAsync(
                            `summon ${mob.type} ${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`
                        );
                        console.log(`Spawned ${mob.type} at ${JSON.stringify(spawnPos)}`);
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
        
        // Clear existing mob spawn interval
        if (this.mobSpawnInterval) {
            system.clearRun(this.mobSpawnInterval);
            this.mobSpawnInterval = undefined;
        }
    
        // Kill all mobs from the current level
        try {
            const currentLevel = this.game.currentLevel;
            const arena = this.game.config.arenaLocation;
            const size = this.game.config.arenaSize;
            
            // Get mob type ID from level configuration
            const mobTypeKey = currentLevel.mobToSpawn as keyof typeof MinecraftEntityTypes;
            const mobTypeId = mobTypeKey; // Use the key directly as the entity type
    
            // Calculate arena bounds
            const xStart = arena.x - Math.floor(size.x / 2);
            const zStart = arena.z - Math.floor(size.z / 2);
            const dx = size.x;
            const dz = size.z;
    
            // Execute kill command for mobs in arena area
            arena.dimension.runCommandAsync(
                `kill @e[type=${mobTypeId},x=${xStart},y=${arena.y},z=${zStart},dx=${dx},dy=${size.y},dz=${dz}]`
            ).then(() => {
                console.log(`Cleared all ${mobTypeId} entities`);
            });
        } catch (error) {
            console.error("Failed to clear mobs:", error);
        }
    }
    
    public spawnTargetBlock(dimension: Dimension) {
        try {
            // Clear previous target block
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
                this.currentTargetBlockPos = pos; // Track new position
                console.log(`Placed target block at ${JSON.stringify(pos)}`);
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
