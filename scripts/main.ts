import { Game1 } from "./Game1";
import ScriptManager from "./ScriptManager";

const sm = new ScriptManager();

sm.registerCode({
  game1: [Game1],
});
