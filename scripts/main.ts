// Fix capitalization and ensure proper export
import { MineTheDiamonds } from "./games/MineTheDiamonds"; // Folder name must match
import { ZombieSurvival } from "./games/ZombieSurvival";
import ScriptManager from "./ScriptManager";

const sm = new ScriptManager();
sm.registerSamples({
  mtd: [MineTheDiamonds],
  zombies: [ZombieSurvival],
});
