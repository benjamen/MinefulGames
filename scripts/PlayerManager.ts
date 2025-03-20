import { Player, GameMode, EntityInventoryComponent, ItemStack } from "@minecraft/server";

export function setupPlayers(players: Player[], inventory: any[], gameMode: GameMode) {
  clearPlayerInventories(players); // Step 1: Clear inventory
  players.forEach((player) => {
    player.setGameMode(gameMode); // Step 2: Set game mode
  });
  setupPlayerInventories(players, inventory); // Step 3: Setup inventory
}

export function clearPlayerInventories(players: Player[]) {
  players.forEach((player) => {
    const inventory = player.getComponent("inventory") as EntityInventoryComponent;
    if (inventory && inventory.container) {
      inventory.container.clearAll();
    }
  });
}

export function setupPlayerInventories(players: Player[], inventoryItems: any[]) {
  players.forEach((player) => {
    const inventory = player.getComponent("inventory") as EntityInventoryComponent;
    if (!inventory || !inventory.container) return;

    inventory.container.clearAll();
    inventoryItems.forEach(({ item, count }) => inventory.container?.addItem(new ItemStack(item, count)));
  });
}
