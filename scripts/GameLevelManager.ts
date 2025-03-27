import { system, Vector3, Dimension, Block, Player } from "@minecraft/server";
import { GameCore } from "./GameCore";

export abstract class GameLevelManager {
  protected currentTargetBlockPos: Vector3 | undefined;
  protected randomBlockPositions: Vector3[] = [];
  protected isSpawningTargetBlock = false;

  constructor(protected game: GameCore) {}

  // Generic utility methods
  protected randomArenaPosition() {
    const arena = this.game.config.arenaLocation;
    const size = this.game.config.arenaSize;
    return {
      x: arena.x + (Math.random() * size.x - size.x / 2),
      y: arena.y + 1,
      z: arena.z + (Math.random() * size.z - size.z / 2),
    };
  }

  protected clearArenaEntities(dimension: Dimension) {
    const arena = this.game.config.arenaLocation;
    const size = this.game.config.arenaSize;
    
    const entities = dimension.getEntities({
      location: { x: arena.x, y: arena.y, z: arena.z },
      maxDistance: Math.max(size.x, size.y, size.z)
    });

    entities.forEach(entity => {
      if (!(entity instanceof Player)) {
        entity.kill();
      }
    });
  }

  protected isValidBlockPlacement(block: Block): boolean {
    const arena = this.game.config.arenaLocation;
    const size = this.game.config.arenaSize;
    const buffer = 1;

    const pos = block.location;
    const xMin = arena.x - size.x / 2 + buffer;
    const xMax = arena.x + size.x / 2 - buffer;
    const yMin = arena.y + buffer;
    const yMax = arena.y + size.y - buffer;
    const zMin = arena.z - size.z / 2 + buffer;
    const zMax = arena.z + size.z / 2 - buffer;

    return (
      pos.x >= xMin && pos.x <= xMax &&
      pos.y >= yMin && pos.y <= yMax &&
      pos.z >= zMin && pos.z <= zMax
    );
  }

  // Abstract methods that specific game implementations must provide
  abstract initializeLevel(): void;
  abstract cleanup(): void;
  abstract preGameCleanup(): void;
  
  // Optional method that games can override if needed
  handleBlockBroken(): void {
    // Optional implementation for subclasses to override
  }

  
}