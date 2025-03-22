import { world, system, BlockPermutation, Vector3, Dimension } from "@minecraft/server";
import type { GameCore } from "./GameCore";

export class LevelManager {
    constructor(private game: GameCore) {}

    initializeLevel() {
        try {
            const dimension = this.game.config.arenaLocation.dimension;
            this.placeRandomBlocks(dimension);
            this.spawnMobs(dimension);
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

    private spawnMobs(dimension: Dimension) {
        const pos = this.randomArenaPosition();
        dimension.spawnEntity(this.game.currentLevel.mobToSpawn, pos);
    }

    private spawnTargetBlock(dimension: Dimension) {
        const pos = this.randomArenaPosition();
        dimension.getBlock(pos)?.setPermutation(
            BlockPermutation.resolve(this.game.currentLevel.blockToBreak)
        );
    }

    private randomArenaPosition(): Vector3 {
        return {
            x: this.game.config.arenaLocation.x + Math.floor(Math.random() * this.game.config.arenaSize.x),
            y: this.game.config.arenaLocation.y + 1,
            z: this.game.config.arenaLocation.z + Math.floor(Math.random() * this.game.config.arenaSize.z)
        };
    }
}