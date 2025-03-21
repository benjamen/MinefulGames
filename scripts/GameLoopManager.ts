//GameLoopManager.ts

import { system } from "@minecraft/server";

export function startGameLoop(
    tickCallback: (curTick: number) => void,
    endCondition: (curTick: number) => boolean, // Pass curTick to endCondition
    timeLimit: number, // Add timeLimit parameter
    tickDelay: number = 1
) {
    let curTick = 0; // Track the current tick

    const runGameTick = () => {
        // Check if the end condition is met (pass curTick to it)
        if (endCondition(curTick) || curTick >= timeLimit) {
            console.log("End condition met. Stopping game loop.");
            return; // Stop the loop
        }

        // Execute the tick callback
        tickCallback(curTick);

        // Increment the tick counter
        curTick++;

        // Schedule the next tick
        system.runTimeout(runGameTick, tickDelay);
    };

    runGameTick(); // Start the loop
}