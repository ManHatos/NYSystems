import { ModuleManager } from "../modules.js";

// importing and exporting all autocomplete files
import autocomplete1 from "./autocomplete/user.js";

export const autocomplete: ModuleManager["autocomplete"] = [autocomplete1];

// importing and exporting all command files
import command1 from "./commands/log.js";
import command2 from "./commands/records.js";

export const commands: ModuleManager["commands"] = [command1, command2];
