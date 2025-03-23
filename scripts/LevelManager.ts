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

    private spawnMobs(dimension: Dimension) {
        try {
            const arena = this.game.config.arenaLocation;
            const size = this.game.config.arenaSize;
            const spawnDimension = this.game.config.arenaLocation.dimension;
    
            // 1. Force-load chunks to ensure spawning area is active
            spawnDimension.runCommand(`forceload add ${arena.x - 16} ${arena.z - 16} ${arena.x + 16} ${arena.z + 16}`);
    
            // 2. Case-insensitive entity type handling
            const entityId = this.game.currentLevel.mobToSpawn.toLowerCase().replace("minecraft:", "");
            const EntityType = MinecraftEntityTypes[entityId as keyof typeof MinecraftEntityTypes];
            
            if (!EntityType) {
                console.error(`Invalid mob type: ${entityId}. Valid options: ${Object.keys(MinecraftEntityTypes).join(", ")}`);
                return;
            }
    
            // 3. Corrected spawn logic
            const spawnCount = 3;
            console.log(`Spawning ${spawnCount} ${entityId} at Y=${arena.y + 1}`);
    
            for (let i = 0; i < spawnCount; i++) {
                // Calculate valid positions within arena bounds
                const offsetX = (Math.random() * (size.x - 4)) - (size.x / 2 - 2);
                const offsetZ = (Math.random() * (size.z - 4)) - (size.z / 2 - 2);
                
                const spawnPos = {
                    x: arena.x + Math.floor(offsetX) + 0.5, // Center in block
                    y: arena.y + 1, // 1 block above floor
                    z: arena.z + Math.floor(offsetZ) + 0.5
                };
    
                // 4. Validate floor block (fix: cobblestone is valid)
                const floorPos = { 
                    x: Math.floor(spawnPos.x), 
                    y: arena.y, 
                    z: Math.floor(spawnPos.z) 
                };
                const floorBlock = spawnDimension.getBlock(floorPos);
                
                // Only reject non-solid blocks (e.g., air, leaves)
                if (!floorBlock || ["minecraft:air", "minecraft:leaves"].includes(floorBlock.typeId)) {
                    console.warn(`Invalid floor at ${floorPos.x},${floorPos.y},${floorPos.z} (${floorBlock?.typeId})`);
                    continue;
                }
    
                // 5. Spawn entity with error handling
                try {
                    const entity = spawnDimension.spawnEntity(entityId, spawnPos);
                    console.log(`Spawned ${entityId} at ${JSON.stringify(spawnPos)}`);
                } catch (error) {
                    console.error(`Failed to spawn at ${JSON.stringify(spawnPos)}:`, error);
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