//PlayManager.ts

import { Player, GameMode, EntityInventoryComponent, ItemStack } from "@minecraft/server";

/**
 * Set up players for the game by clearing their inventories, setting their game mode, and giving them starting items.
 * @param players The players to set up
 * @param inventory The starting inventory items
 * @param gameMode The game mode to set for the players
 */
export function setupPlayers(players: Player[], inventory: { item: string; count: number }[], gameMode: GameMode) {
  clearPlayerInventories(players); // Step 1: Clear inventory
  players.forEach((player) => {
    player.setGameMode(gameMode); // Step 2: Set game mode
  });
  setupPlayerInventories(players, inventory); // Step 3: Setup inventory
}

/**
 * Clear the inventories of all players.
 * @param players The players whose inventories should be cleared
 */
export function clearPlayerInventories(players: Player[]) {
  players.forEach((player) => {
    const inventory = player.getComponent("inventory") as EntityInventoryComponent;
    if (inventory?.container) {
      inventory.container.clearAll();
    }
  });
}

/**
 * Set up the inventories of all players with the given items.
 * @param players The players whose inventories should be set up
 * @param inventoryItems The items to add to the players' inventories
 */
export function setupPlayerInventories(players: Player[], inventoryItems: { item: string; count: number }[]) {
  players.forEach((player) => {
    const inventory = player.getComponent("inventory") as EntityInventoryComponent;
    if (!inventory?.container) {
      console.warn(`Failed to access inventory for player: ${player.name}`);
      return;
    }

    inventory.container.clearAll(); // Clear inventory before adding new items
    inventoryItems.forEach(({ item, count }) => {
      try {
        const itemStack = new ItemStack(item, count);
        inventory.container?.addItem(itemStack);
      } catch (error) {
        console.error(`Failed to add item ${item} to player ${player.name}:`, error);
      }
    });
  });
}
