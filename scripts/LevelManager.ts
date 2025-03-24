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
            const dimension = world.getDimension("overworld");
            const testPos = { x: 25, y: -40, z: 0 }; // Replace with valid coordinates
            dimension.spawnEntity(MinecraftEntityTypes.Zombie, testPos);
            
    
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