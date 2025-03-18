import { world, system } from "@minecraft/server";

export default class ScriptManager {
    private tickCount: number = 0;
    private pendingFuncs: { name: string; func: Function; location: any }[] = [];
    private _availableFuncs: Record<string, Function[]> = {};

    constructor() {
        this.gamePlayLogger = this.gamePlayLogger.bind(this);
        this.worldTick = this.worldTick.bind(this);
        system.afterEvents.scriptEventReceive.subscribe(this.newScriptEvent.bind(this));
        system.run(this.worldTick);
    }

    private gamePlayLogger(message: string, status?: number): void {
        if (status !== undefined) {
            message = status > 0 ? `SUCCESS: ${message}` : `FAIL: ${message}`;
        }
        world.sendMessage(message);
        console.warn(message);
    }

    private newScriptEvent(scriptEvent: any): void {
        const messageId: string = scriptEvent.id.toLowerCase();
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
            } else {
                this.gamePlayLogger(`Unknown game: ${gameName}`, -1);
            }
        }
    }

    private runSample(sampleId: string, snippetFunctions: Function[], targetLocation: any): void {
        for (let i = snippetFunctions.length - 1; i >= 0; i--) {
            this.pendingFuncs.push({ name: sampleId, func: snippetFunctions[i], location: targetLocation });
        }
    }

    private worldTick(): void {
        if (this.tickCount % 10 === 0 && this.pendingFuncs.length > 0) {
            const funcSet = this.pendingFuncs.pop();
            if (funcSet) {
                try {
                    funcSet.func(this.gamePlayLogger, funcSet.location);
                } catch (e) {
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

    public registerCode(sampleSet: Record<string, Function[]>): void {
        for (const sampleKey in sampleSet) {
            if (sampleKey.length > 1 && sampleSet[sampleKey]) {
                this._availableFuncs[sampleKey] = sampleSet[sampleKey];
            }
        }
    }
}
