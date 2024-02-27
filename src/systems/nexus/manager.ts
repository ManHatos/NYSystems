import { SystemManager } from "../types.js";

// importing and exporting all component files
import component1 from "./components/getStarted.js";
import component2 from "./components/selectRegistrar.js";
import component3 from "./components/confirmAccount.js";
import component4 from "./components/incorrectAccount.js";
import component5 from "./components/selectName.js";

export const components: SystemManager["components"] = [
	component1,
	component2,
	component3,
	component4,
	component5,
];
