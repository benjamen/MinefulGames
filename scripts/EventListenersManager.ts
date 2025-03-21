// EventListenersManager.ts
import { world, Player } from "@minecraft/server";
import { EventManager } from "./EventManager";

export function setupPlayerBreakListener(
    eventManager: EventManager,
    blockToBreak: string,
    onBlockBreak: (player: Player, blockType: string) => void
) {
    eventManager.subscribe(world.beforeEvents.playerBreakBlock, (eventData) => {
        const player = eventData.player;
        const block = eventData.block;

        if (block.typeId === blockToBreak) {
            onBlockBreak(player, block.typeId);
        }
    });
}

export function setupPlayerDeathListener(
    eventManager: EventManager,
    players: Player[],
    onPlayerDeath: (player: Player) => void
) {
    eventManager.subscribe(world.afterEvents.entityDie, (eventData) => {
        const entity = eventData.deadEntity;
        if (entity instanceof Player && players.includes(entity)) {
            onPlayerDeath(entity);
        }
    });
}