import { SystemManager } from "../types.js";

// importing and exporting all component files
import component1 from "./components/getStarted.js";
import component2 from "./components/selectRegistrar.js";

export const components: SystemManager["components"] = [component1, component2];
