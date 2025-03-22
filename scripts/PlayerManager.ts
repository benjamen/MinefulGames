import { Player, EntityInventoryComponent, ItemStack } from "@minecraft/server";
import type { GameCore } from "./GameCore";

export class PlayerManager {
    constructor(private game: GameCore) {}

    respawnPlayer(player: Player) {
        try {
            this.clearInventory(player);
            this.giveStarterItems(player);
            player.teleport(this.game.config.arenaLocation, {
                dimension: this.game.config.arenaLocation.dimension
            });
        } catch (error) {
            console.error("Respawn failed:", error);
        }
    }

    private clearInventory(player: Player) {
        const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        inventory.container?.clearAll();
    }

    private giveStarterItems(player: Player) {
        const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        this.game.config.startingInventory.forEach(item => {
            inventory.container?.addItem(new ItemStack(item.item, item.count));
        });
    }
}