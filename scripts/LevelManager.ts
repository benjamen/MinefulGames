import { world, system, BlockPermutation, Vector3, Dimension, Block } from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import type { GameCore } from "./GameCore";
import { Vector3Utils } from "@minecraft/math";

export class LevelManager {
    private mobSpawnInterval?: number;
    private currentTargetBlockPos: Vector3 | undefined;
    private randomBlockPositions: Vector3[] = []; // Track placed random block positions
    
    constructor(private game: GameCore) {}

    initializeLevel() {
        try {
            const dimension = this.game.config.arenaLocation.dimension;
            
            // Clear existing entities in the arena first
            this.clearArenaEntities(dimension);
            
            // Reset tracked block positions
            this.randomBlockPositions = [];
            
            this.placeRandomBlocks(dimension);
            this.spawnTargetBlock(dimension);
            
            // Spawn initial mobs
            this.spawnMobs(dimension);
            
        } catch (error) {
            console.error("Level initialization failed:", error);
        }
    }
    
    // In LevelManager.ts - Update spawnMobs
    private async spawnMobs(dimension: Dimension) {
        try {
            const arena = this.game.config.arenaLocation;
            const currentLevel = this.game.currentLevel;
            const mobTypeKey = currentLevel.mobToSpawn as keyof typeof MinecraftEntityTypes;
            const mobType = MinecraftEntityTypes[mobTypeKey];
            
            // Clear existing mobs first
            await this.clearArenaEntities(dimension);
            
            // Spawn mobs with slight delay between each
            for (let i = 0; i < currentLevel.mobCount; i++) {
                const spawnPos = this.randomArenaPosition();
                try {
                    await dimension.runCommandAsync(
                        `summon ${mobType} ${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`
                    );
                    console.log(`Spawned ${mobType} at ${JSON.stringify(spawnPos)}`);
                    await system.runTimeout(() => {}, 5); // Small delay between spawns
                } catch (error) {
                    console.warn(`Failed to spawn ${mobType}:`, error);
                }
            }
        } catch (error) {
            console.error("Mob spawning failed:", error);
        }
    }

    // LevelManager.ts - Update cleanup method
    public cleanup() {
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
            const mobTypeId = mobTypeKey.toLowerCase(); // Ensure lowercase for command
            
            // Calculate arena bounds
            const xStart = arena.x - Math.floor(size.x / 2);
            const zStart = arena.z - Math.floor(size.z / 2);
            const dx = size.x;
            const dz = size.z;
            
            // Execute kill command for mobs in arena area
            arena.dimension.runCommandAsync(
                `kill @e[type=${mobTypeId},x=${xStart},y=${arena.y},z=${zStart},dx=${dx},dy=${size.y},dz=${dz}]`
            ).catch(error => console.error("Failed to clear mobs:", error));
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
    
            const pos = this.randomArenaPosition(); // Just Vector3
            const block = dimension.getBlock(pos); // Pass dimension separately
            
            if (block?.isValid()) {
                block.setPermutation(
                    BlockPermutation.resolve(this.game.currentLevel.blockToBreak)
                );
                this.currentTargetBlockPos = pos;
                console.log(`Placed target block at ${JSON.stringify(pos)}`);
            }
        } catch (error) {
            console.error("Block spawn failed:", error);
        }
    }

    private randomArenaPosition(): Vector3 { // Returns just Vector3 without dimension
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        
        return {
            x: arena.x - Math.floor(size.x/2) + Math.floor(Math.random() * size.x),
            y: arena.y + 1 + Math.floor(Math.random() * (size.y - 2)),
            z: arena.z - Math.floor(size.z/2) + Math.floor(Math.random() * size.z)
        };
    }

    private clearArenaEntities(dimension: Dimension) {
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        
        // Calculate arena bounds precisely
        const xStart = arena.x - Math.floor(size.x / 2);
        const zStart = arena.z - Math.floor(size.z / 2);
        
        // Kill all non-player entities in the arena
        dimension.runCommandAsync(
            `kill @e[type=!player,x=${xStart},y=${arena.y},z=${zStart},dx=${size.x},dy=${size.y},dz=${size.z}]`
        );
    }
    
    private isValidBlockPlacement(block: Block): boolean {
        // Check block is not in walls, floor, or ceiling
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        
        const xStart = arena.x - Math.floor(size.x / 2);
        const xEnd = arena.x + Math.floor(size.x / 2);
        const yStart = arena.y;
        const yEnd = arena.y + size.y;
        const zStart = arena.z - Math.floor(size.z / 2);
        const zEnd = arena.z + Math.floor(size.z / 2);
        
        const pos = block.location;
        
        // Check if block is on the walls, floor, or ceiling
        const isWall = 
            pos.x === xStart || pos.x === xEnd ||
            pos.z === zStart || pos.z === zEnd;
        
        const isFloorOrCeiling = 
            pos.y === yStart || pos.y === yEnd;
        
        return !isWall && !isFloorOrCeiling;
    }
    
    private placeRandomBlocks(dimension: Dimension) {
        const arena = this.game.config.arenaLocation;
        const blockTypesToPlace = [
            this.game.currentLevel.randomBlockToPlace
        ];
        
        const blockPlacementAttempts = 20; // More attempts to ensure valid placements
        
        for (let i = 0; i < blockPlacementAttempts; i++) {
            const pos = this.randomArenaPosition();
            const block = dimension.getBlock(pos);
            
            if (block && this.isValidBlockPlacement(block)) {
                const blockType = blockTypesToPlace[Math.floor(Math.random() * blockTypesToPlace.length)];
                
                block.setPermutation(
                    BlockPermutation.resolve(blockType)
                );
                
                this.randomBlockPositions.push(pos);
                
                // Limit random blocks
                if (this.randomBlockPositions.length >= 15) break;
            }
        }
    }
}
