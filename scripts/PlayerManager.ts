import { Player, EntityInventoryComponent, ItemStack, Dimension, system } from "@minecraft/server";
import type { GameCore } from "./GameCore";
import { clearArena, setupArena } from "./ArenaManager";

// Add this interface to your GameCore.ts
export interface PlayerManagementConfig {
  respawnLocation: { x: number; y: number; z: number; dimension: Dimension };
  startingInventory: Array<{ item: string; count: number }>;
  playerTag: string;
  respawnStrategy?: "instant" | "delayed";
}

export class PlayerManager {
  private config: PlayerManagementConfig;

  constructor(private game: GameCore) {
    this.config = {
      respawnLocation: game.config.arenaLocation,
      startingInventory: game.config.startingInventory,
      playerTag: game.config.playerTag,
      respawnStrategy: game.config.respawnStrategy || "instant",
    };
  }

  // In PlayerManager.ts (hypothetical)
// Add to PlayerManager class
// Add to PlayerManager class
public respawnPlayer(player: Player) {
  // Clear existing arena
  clearArena(this.game.config.arenaLocation, this.game.config.arenaSize);
  
  // Rebuild arena with delay
  system.runTimeout(() => {
      setupArena(
          this.game.config.arenaLocation,
          this.game.config.arenaSize,
          this.game.config.arenaSettings
      );
      
      // Teleport player after rebuild
      system.runTimeout(() => {
          player.teleport(
              {
                  x: this.game.config.arenaLocation.x,
                  y: this.game.config.arenaLocation.y + 2,
                  z: this.game.config.arenaLocation.z
              },
              { dimension: this.game.config.arenaLocation.dimension }
          );
          player.runCommand(`gamemode ${this.game.config.defaultGamemode}`);
      }, 40);
  }, 20);
}

  public isGamePlayer(player: Player): boolean {
    return player.hasTag(this.config.playerTag);
  }

  private clearInventory(player: Player) {
    const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
    inventory.container?.clearAll();
  }

  private giveStarterItems(player: Player) {
    const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
    this.config.startingInventory.forEach((item) => {
      inventory.container?.addItem(new ItemStack(item.item, item.count));
    });
  }

  // Add to GameCore config interface
  public updateRespawnStrategy(newStrategy: "instant" | "delayed") {
    this.config.respawnStrategy = newStrategy;
  }
}
