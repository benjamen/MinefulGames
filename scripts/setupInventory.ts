import { Player, ItemStack, EntityInventoryComponent } from "@minecraft/server";

export function setupInventory(player: Player, items: ItemStack[]) {
  let inv = player.getComponent("inventory") as EntityInventoryComponent;
  if (!inv || !inv.container) return;

  for (const item of items) {
    inv.container.addItem(item);
  }
}
