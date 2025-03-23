import { world, system, BlockPermutation, Vector3, Dimension } from "@minecraft/server";
    import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import type { GameCore } from "./GameCore";

export class LevelManager {
    constructor(private game: GameCore) {}

    initializeLevel() {
        try {
            const dimension = this.game.config.arenaLocation.dimension;
            this.placeRandomBlocks(dimension);
            this.spawnEntity(dimension); // Call spawnEntity during level initialization
            this.spawnTargetBlock(dimension);
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



    private spawnEntity(dimension: Dimension) {
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
    
        // Spawn mobs on the ARENA FLOOR (y = arena.y)
        const spawnCount = Math.floor(Math.random() * 2) + 1;
    
        for (let i = 0; i < spawnCount; i++) {
            const x = arena.x + Math.floor(Math.random() * size.x) - Math.floor(size.x / 2);
            const z = arena.z + Math.floor(Math.random() * size.z) - Math.floor(size.z / 2);
            const y = arena.y; // Spawn directly on the arena floor
    
    
            try {
                dimension.spawnEntity(this.game.currentLevel.mobToSpawn, { x, y: y + 1, z }); // Spawn 1 block above floor
            } catch (error) {
                console.error(`Failed to spawn mob:`, error);
            }
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