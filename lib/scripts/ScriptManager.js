import { world, system } from "@minecraft/server";
export default class ScriptManager {
    // Logger for game events
    gamePlayLogger(message, status) {
        if (status !== undefined && status > 0) {
            message = "SUCCESS: " + message;
        }
        else if (status !== undefined && status < 0) {
            message = "FAIL: " + message;
        }
        world.sendMessage(message);
        console.warn(message);
    }
    // Handles script events triggered by /scriptevent commands
    newScriptEvent(scriptEvent) {
        const messageId = scriptEvent.id.toLowerCase();
        // Extract the command and game name (e.g., "run:game1")
        const [command, gameName] = messageId.split(":");
        if (command === "run" && gameName && scriptEvent.sourceEntity) {
            // Determine the location based on the player's view
            const nearbyBlock = scriptEvent.sourceEntity.getBlockFromViewDirection();
            if (!nearbyBlock) {
                this.gamePlayLogger("Please look at the block where you want me to run this.");
                return;
            }
            const nearbyBlockLoc = nearbyBlock.block.location;
            const nearbyLoc = {
                x: nearbyBlockLoc.x,
                y: nearbyBlockLoc.y + 1,
                z: nearbyBlockLoc.z,
                dimension: scriptEvent.sourceEntity.dimension,
            };
            // Check if the game is registered in _availableFuncs
            const normalizedGameName = gameName.toLowerCase(); // Case-insensitive matching
            if (this._availableFuncs[normalizedGameName]) {
                const GameFunctions = this._availableFuncs[normalizedGameName];
                // Call runSample with the correct arguments
                this.runSample(normalizedGameName + this.tickCount, GameFunctions, nearbyLoc);
                this.gamePlayLogger(`Successfully started ${gameName}.`, 1); // Log success
            }
            else {
                this.gamePlayLogger(`Unknown game: ${gameName}`, -1); // Log failure if not registered
            }
        }
    }
    // Adds a game's functions to the pending queue for execution
    runSample(sampleId, snippetFunctions, targetLocation) {
        for (let i = snippetFunctions.length - 1; i >= 0; i--) {
            this.pendingFuncs.push({ name: sampleId, func: snippetFunctions[i], location: targetLocation });
        }
    }
    // Main world tick function to process queued functions
    worldTick() {
        if (this.tickCount % 10 === 0) {
            if (this.pendingFuncs.length > 0) {
                const funcSet = this.pendingFuncs.pop();
                if (funcSet) {
                    try {
                        funcSet.func(this.gamePlayLogger, funcSet.location);
                    }
                    catch (e) {
                        world.sendMessage("Could not run code function. Error: " + e.toString());
                    }
                }
            }
        }
        if (this.tickCount === 200) {
            world.sendMessage("Type '/scriptevent run:<game_name>' in chat to run a specific game.");
        }
        this.tickCount++;
        system.run(this.worldTick);
    }
    // Constructor to initialize the ScriptManager
    constructor() {
        this.tickCount = 0;
        // Queue for pending functions to execute
        this.pendingFuncs = [];
        this._availableFuncs = {};
        this.gamePlayLogger = this.gamePlayLogger.bind(this);
        this.worldTick = this.worldTick.bind(this);
        system.afterEvents.scriptEventReceive.subscribe(this.newScriptEvent.bind(this));
        system.run(this.worldTick);
    }
    // Registers game scripts to the manager
    registerCode(sampleSet) {
        for (const sampleKey in sampleSet) {
            if (sampleKey.length > 1 && sampleSet[sampleKey]) {
                this._availableFuncs[sampleKey] = sampleSet[sampleKey];
            }
        }
    }
}
//# sourceMappingURL=ScriptManager.js.map