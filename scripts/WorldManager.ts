import { world, MinecraftDimensionTypes } from "@minecraft/server";

/**
 * Set the world settings, including time of day and difficulty.
 * @param dayOrNight The desired time of day ("day" or "night")
 * @param difficulty The desired difficulty ("easy", "normal", "hard", or "peaceful")
 */
export function setWorldSettings(dayOrNight: string, difficulty: string) {
  try {
    // Set the time of day
    const timeSettings: Record<string, number> = { day: 6000, night: 18000 };
    if (timeSettings[dayOrNight] !== undefined) {
      world.setTimeOfDay(timeSettings[dayOrNight]);

      // Enable or disable the daylight cycle based on the time of day
      const daylightCycleEnabled = dayOrNight === "day" ? "true" : "false";
      world
        .getDimension(MinecraftDimensionTypes.overworld)
        .runCommand(`gamerule doDaylightCycle ${daylightCycleEnabled}`);
    } else {
      console.warn(`Invalid time of day setting: ${dayOrNight}. Valid options are "day" or "night".`);
    }

    // Set the difficulty
    const validDifficulties = ["easy", "normal", "hard", "peaceful"];
    if (validDifficulties.includes(difficulty)) {
      world.getDimension(MinecraftDimensionTypes.overworld).runCommand(`difficulty ${difficulty}`);
    } else {
      console.warn(
        `Invalid difficulty setting: ${difficulty}. Valid options are "easy", "normal", "hard", or "peaceful".`
      );
    }
  } catch (error) {
    console.error("❌ Error setting world settings:", error);
  }
}
