import { world, system } from "@minecraft/server";
export default class ScriptManager {
    constructor() {
        this.tickCount = 0;
        this.pendingFuncs = [];
        this._availableFuncs = {};
        this.gamePlayLogger = this.gamePlayLogger.bind(this);
        this.worldTick = this.worldTick.bind(this);
        system.afterEvents.scriptEventReceive.subscribe(this.newScriptEvent.bind(this));
        system.run(this.worldTick);
    }
    gamePlayLogger(message, status) {
        if (status !== undefined) {
            message = status > 0 ? `SUCCESS: ${message}` : `FAIL: ${message}`;
        }
        world.sendMessage(message);
        console.warn(message);
    }
    newScriptEvent(scriptEvent) {
        const messageId = scriptEvent.id.toLowerCase();
        const [command, gameName] = messageId.split(":");
        if (command === "run" && gameName && scriptEvent.sourceEntity) {
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
            const normalizedGameName = gameName.toLowerCase();
            if (this._availableFuncs[normalizedGameName]) {
                const GameFunctions = this._availableFuncs[normalizedGameName];
                this.runSample(`${normalizedGameName}${this.tickCount}`, GameFunctions, nearbyLoc);
                this.gamePlayLogger(`Successfully started ${gameName}.`, 1);
            }
            else {
                this.gamePlayLogger(`Unknown game: ${gameName}`, -1);
            }
        }
    }
    runSample(sampleId, snippetFunctions, targetLocation) {
        for (let i = snippetFunctions.length - 1; i >= 0; i--) {
            this.pendingFuncs.push({ name: sampleId, func: snippetFunctions[i], location: targetLocation });
        }
    }
    worldTick() {
        if (this.tickCount % 10 === 0 && this.pendingFuncs.length > 0) {
            const funcSet = this.pendingFuncs.pop();
            if (funcSet) {
                try {
                    funcSet.func(this.gamePlayLogger, funcSet.location);
                }
                catch (e) {
                    world.sendMessage(`Could not run code function. Error: ${e.toString()}`);
                }
            }
        }
        if (this.tickCount === 200) {
            world.sendMessage("Type '/scriptevent run:<game_name>' in chat to run a specific game.");
        }
        this.tickCount++;
        system.run(this.worldTick);
    }
    registerCode(sampleSet) {
        for (const sampleKey in sampleSet) {
            if (sampleKey.length > 1 && sampleSet[sampleKey]) {
                this._availableFuncs[sampleKey] = sampleSet[sampleKey];
            }
        }
    }
}
//# sourceMappingURL=ScriptManager.js.map