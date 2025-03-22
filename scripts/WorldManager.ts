import { world } from "@minecraft/server";

export function setWorldSettings(dayOrNight: "day" | "night") {
    world.setTimeOfDay(dayOrNight === "day" ? 6000 : 18000);
    world.getDimension("overworld").runCommand(`gamerule doDaylightCycle false`);
}