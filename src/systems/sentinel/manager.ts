import { RecordActions } from "../../services/datastore.js";
import { UsersAvatar, UsersSingle } from "../../services/roblox/users.js";
import { SystemManager } from "../systems.js";

// importing and exporting all autocomplete files
import autocomplete1 from "./autocomplete/user.js";

export const autocomplete: SystemManager["autocomplete"] = [autocomplete1];

// importing and exporting all command files
import command1 from "./commands/log.js";
import command2 from "./commands/lookup.js";

export const commands: SystemManager["commands"] = [command1, command2];

// importing and exporting all component files
import component1 from "./components/confirmLog.js";

export const components: SystemManager["components"] = [component1];

// additional system typings
export type command1CacheData = {
	input: {
		reason: string;
		action: RecordActions;
		warningCount: number;
	};
	roblox: {
		user: UsersSingle;
		avatar: UsersAvatar["imageUrl"];
	};
};