export function setupInventory(player, items) {
    let inv = player.getComponent("inventory");
    if (!inv || !inv.container)
        return;
    for (const item of items) {
        inv.container.addItem(item);
    }
}
//# sourceMappingURL=setupInventory.js.map