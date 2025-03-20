import { world, system, DimensionLocation, ScriptEventCommandMessageAfterEvent } from "@minecraft/server";

export default class ScriptManager {
  tickCount = 0;

  _availableFuncs: {
    [name: string]: Array<(log: (message: string, status?: number) => void, location: DimensionLocation) => void>;
  };

  pendingFuncs: Array<{
    name: string;
    func: (log: (message: string, status?: number) => void, location: DimensionLocation) => void;
    location: DimensionLocation;
  }> = [];

  gamePlayLogger(message: string, status?: number) {
    if (status !== undefined && status > 0) {
      message = "SUCCESS: " + message;
    } else if (status !== undefined && status < 0) {
      message = "FAIL: " + message;
    }

    world.sendMessage(message);
    console.warn(message);
  }

  newScriptEvent(scriptEvent: ScriptEventCommandMessageAfterEvent) {
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
      } else {
        this.gamePlayLogger(`Unknown game: ${gameName}`, -1);
      }
    }
  }

  runSample(
    sampleId: string,
    snippetFunctions: Array<(log: (message: string, status?: number) => void, location: DimensionLocation) => void>,
    targetLocation: DimensionLocation
  ) {
    for (let i = snippetFunctions.length - 1; i >= 0; i--) {
      this.pendingFuncs.push({ name: sampleId, func: snippetFunctions[i], location: targetLocation });
    }
  }

  worldTick() {
    if (this.tickCount % 10 === 0) {
      if (this.pendingFuncs.length > 0) {
        const funcSet = this.pendingFuncs.pop();

        if (funcSet) {
          try {
            funcSet.func(this.gamePlayLogger, funcSet.location);
          } catch (e: any) {
            world.sendMessage("Could not run sample function. Error: " + e.toString());
          }
        }
      }
    }
    if (this.tickCount === 200) {
      world.sendMessage("Type '/scriptevent sample:run' in chat to run this sample.");
    }

    this.tickCount++;

    system.run(this.worldTick);
  }

  constructor() {
    this._availableFuncs = {};

    this.gamePlayLogger = this.gamePlayLogger.bind(this);

    this.worldTick = this.worldTick.bind(this);

    system.afterEvents.scriptEventReceive.subscribe(this.newScriptEvent.bind(this));

    system.run(this.worldTick);
  }

  registerSamples(sampleSet: {
    [name: string]: Array<(log: (message: string, status?: number) => void, location: DimensionLocation) => void>;
  }) {
    for (const sampleKey in sampleSet) {
      if (sampleKey.length > 1 && sampleSet[sampleKey]) {
        this._availableFuncs[sampleKey] = sampleSet[sampleKey];
      }
    }
  }
}
