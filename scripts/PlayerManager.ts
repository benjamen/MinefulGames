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
  // Remove arena clearing/rebuilding logic
  player.teleport(
    {
      x: this.game.config.arenaLocation.x,
      y: this.game.config.arenaLocation.y + 2,
      z: this.game.config.arenaLocation.z
    },
    { dimension: this.game.config.arenaLocation.dimension }
  );
  
  // Reset player state
  player.runCommand(`gamemode ${this.game.config.defaultGamemode}`);
  const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
  inventory.container?.clearAll();
  this.config.startingInventory.forEach((item) => {
    inventory.container?.addItem(new ItemStack(item.item, item.count));
  });
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
