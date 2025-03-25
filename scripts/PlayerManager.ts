import { Player, EntityInventoryComponent, ItemStack, Dimension } from "@minecraft/server";
import type { GameCore } from "./GameCore";

// Add this interface to your GameCore.ts
export interface PlayerManagementConfig {
    respawnLocation: { x: number; y: number; z: number; dimension: Dimension };
    startingInventory: Array<{ item: string; count: number }>;
    playerTag: string;
    respawnStrategy?: 'instant' | 'delayed';
}

export class PlayerManager {
    private config: PlayerManagementConfig;

    constructor(private game: GameCore) {
        this.config = {
            respawnLocation: game.config.arenaLocation,
            startingInventory: game.config.startingInventory,
            playerTag: game.config.playerTag,
            respawnStrategy: game.config.respawnStrategy || 'instant'
        };
    }

    respawnPlayer(player: Player) {
        try {
            this.clearInventory(player);
            this.giveStarterItems(player);
            
            player.teleport(
                this.config.respawnLocation, 
                { dimension: this.config.respawnLocation.dimension }
            );
            
            if (this.config.respawnStrategy === 'delayed') {
                player.addEffect('resistance', 100, { amplifier: 5, showParticles: false });
            }
        } catch (error) {
            console.error("Respawn failed:", error);
        }
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
        this.config.startingInventory.forEach(item => {
            inventory.container?.addItem(new ItemStack(item.item, item.count));
        });
    }

    // Add to GameCore config interface
    public updateRespawnStrategy(newStrategy: 'instant' | 'delayed') {
        this.config.respawnStrategy = newStrategy;
    }
}