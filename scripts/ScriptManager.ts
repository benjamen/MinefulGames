import { world, system, DimensionLocation, ScriptEventCommandMessageAfterEvent, Player } from "@minecraft/server";

export default class ScriptManager {
  tickCount = 0;

  _availableFuncs: {
    [name: string]: Array<
      (log: (message: string, status?: number) => void, location: DimensionLocation, params?: string[]) => void
    >;
  } = {};

  pendingFuncs: Array<{
    name: string;
    func: (log: (message: string, status?: number) => void, location: DimensionLocation, params?: string[]) => void;
    location: DimensionLocation;
    params?: string[];
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
    const [command, gameName, ...params] = messageId.split(":");

    if (command === "run" && gameName && scriptEvent.sourceEntity) {
      const sourceEntity = scriptEvent.sourceEntity;
      if (sourceEntity instanceof Player) {
        const player = sourceEntity;
        const tag = gameName.toUpperCase(); // e.g., "MTD"
        if (!player.hasTag(tag)) {
          player.addTag(tag);
          this.gamePlayLogger(`Added ${tag} tag to player ${player.name}`, 1);
        }

        // Use player's location (optional, adjust as needed)
        const playerLoc = player.location;
        const nearbyLoc = {
          x: Math.floor(playerLoc.x),
          y: Math.floor(playerLoc.y),
          z: Math.floor(playerLoc.z),
          dimension: player.dimension,
        };

        // Run the game function
        const normalizedGameName = gameName.toLowerCase();
        if (this._availableFuncs[normalizedGameName]) {
          const GameFunctions = this._availableFuncs[normalizedGameName];
          this.runSample(`${normalizedGameName}${this.tickCount}`, GameFunctions, nearbyLoc, params);
          this.gamePlayLogger(`Successfully started ${gameName}.`, 1);
        } else {
          this.gamePlayLogger(`Unknown game: ${gameName}`, -1);
        }
      } else {
        this.gamePlayLogger("Only players can start the game.", -1);
      }
    }
  }

  runSample(
    sampleId: string,
    snippetFunctions: Array<
      (log: (message: string, status?: number) => void, location: DimensionLocation, params?: string[]) => void
    >,
    targetLocation: DimensionLocation,
    params?: string[]
  ) {
    for (let i = snippetFunctions.length - 1; i >= 0; i--) {
      this.pendingFuncs.push({
        name: sampleId,
        func: snippetFunctions[i],
        location: targetLocation,
        params,
      });
    }
  }

  worldTick() {
    if (this.tickCount % 10 === 0) {
      if (this.pendingFuncs.length > 0) {
        const funcSet = this.pendingFuncs.pop();

        if (funcSet) {
          try {
            funcSet.func(this.gamePlayLogger, funcSet.location, funcSet.params);
          } catch (e: any) {
            world.sendMessage("Could not run sample function. Error: " + e.toString());
          }
        }
      }
    }
    if (this.tickCount === 200) {
      world.sendMessage("Type '/scriptevent run:mtd:x:y:z' in chat to run this sample with custom location.");
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
    [name: string]: Array<
      (log: (message: string, status?: number) => void, location: DimensionLocation, params?: string[]) => void
    >;
  }) {
    for (const sampleKey in sampleSet) {
      if (sampleKey.length > 1 && sampleSet[sampleKey]) {
        this._availableFuncs[sampleKey] = sampleSet[sampleKey];
      }
    }
  }
}
