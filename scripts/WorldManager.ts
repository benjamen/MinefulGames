import { world, MinecraftDimensionTypes } from "@minecraft/server";

export function setWorldSettings(dayOrNight: string, difficulty: string) {
  try {
    const timeSettings: Record<string, number> = { day: 6000, night: 18000 };
    if (timeSettings[dayOrNight] !== undefined) {
      world.setTimeOfDay(timeSettings[dayOrNight]);
      world
        .getDimension(MinecraftDimensionTypes.overworld)
        .runCommand(`gamerule doDaylightCycle ${dayOrNight === "day" ? "true" : "false"}`);
    }
  } catch (error) {
    console.error("Error setting world settings:", error);
  }
  world.getDimension(MinecraftDimensionTypes.overworld).runCommand(`difficulty ${difficulty}`);
}
