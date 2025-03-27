import { world } from "@minecraft/server";

export function setWorldSettings(mode: "gameStart" | "gameEnd") {
  if (mode === "gameStart") {
    // Set to survival difficulty with mobs
    world.getDimension("overworld").runCommand(`difficulty easy`);
    world.getDimension("overworld").runCommand(`gamerule doDaylightCycle false`);
    world.getDimension("overworld").runCommand(`gamerule mobGriefing true`);
    world.setTimeOfDay(6000); // Always daytime
  } else {
    // Revert to peaceful creative settings
    world.getDimension("overworld").runCommand(`difficulty peaceful`);
    world.getDimension("overworld").runCommand(`gamerule doDaylightCycle true`);
    world.getDimension("overworld").runCommand(`gamerule mobGriefing false`);
  }
}
