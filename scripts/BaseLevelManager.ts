import { system, BlockPermutation, Vector3, Dimension, Block } from "@minecraft/server";
import { GameCore } from "./GameCore";

export abstract class BaseLevelManager {
    protected currentTargetBlockPos: Vector3 | undefined;
    protected randomBlockPositions: Vector3[] = [];
    protected isSpawningTargetBlock = false;

    constructor(protected game: GameCore) {}

    // Generic methods
    protected randomArenaPosition(): Vector3 {
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        return {
            x: arena.x - Math.floor(size.x/2) + Math.floor(Math.random() * size.x),
            y: arena.y + 1 + Math.floor(Math.random() * (size.y - 2)),
            z: arena.z - Math.floor(size.z/2) + Math.floor(Math.random() * size.z)
        };
    }

    protected clearArenaEntities(dimension: Dimension) {
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        const xStart = arena.x - Math.floor(size.x / 2);
        const zStart = arena.z - Math.floor(size.z / 2);
        
        dimension.runCommandAsync(
            `kill @e[type=!player,x=${xStart},y=${arena.y},z=${zStart},dx=${size.x},dy=${size.y},dz=${size.z}]`
        );
    }

    protected isValidBlockPlacement(block: Block): boolean {
        const arena = this.game.config.arenaLocation;
        const size = this.game.config.arenaSize;
        const buffer = 1;
        
        const xStart = arena.x - Math.floor(size.x / 2);
        const xEnd = arena.x + Math.floor(size.x / 2);
        const yStart = arena.y;
        const yEnd = arena.y + size.y;
        const zStart = arena.z - Math.floor(size.z / 2);
        const zEnd = arena.z + Math.floor(size.z / 2);
        
        const pos = block.location;
        return !(
            pos.x <= xStart + buffer || pos.x >= xEnd - buffer ||
            pos.z <= zStart + buffer || pos.z >= zEnd - buffer ||
            pos.y <= yStart + buffer || pos.y >= yEnd - buffer
        );
    }

    // Abstract methods to be implemented by specific games
    abstract initializeLevel(): void;
    abstract cleanup(): void;
    abstract preGameCleanup(): void;
    abstract spawnTargetBlock(dimension: Dimension): void;
}