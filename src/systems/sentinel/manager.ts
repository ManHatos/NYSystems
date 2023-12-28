import { BanRequest, RecordActions } from "../../services/datastore.js";
import { UsersAvatar, UsersSingle } from "../../services/roblox/users.js";
import { SystemManager } from "../systems.js";
import { Message } from "@discordeno/bot";
import { Records } from "@prisma/client";

// importing and exporting all autocomplete files
import autocomplete1 from "./autocomplete/user.js";

export const autocomplete: SystemManager["autocomplete"] = [autocomplete1];

// importing and exporting all command files
import command1 from "./commands/log.js";
import command2 from "./commands/lookup.js";

export const commands: SystemManager["commands"] = [command1, command2];

// importing and exporting all component files
import component1 from "./components/confirmRecord.js";
import component2 from "./components/confirmBanRequest.js";
import component3 from "./components/manageRecord.js";
import component4 from "./components/editAction.js";
import component5 from "./components/confirmDelete.js";

export const components: SystemManager["components"] = [
	component1,
	component2,
	component3,
	component4,
	component5,
];

// import and exporting all modal files
import modal1 from "./modals/editReason.js";

export const modals: SystemManager["modals"] = [modal1];

// additional system typings
export type command1CacheData = {
	input: {
		reason: string;
		action: RecordActions | BanRequest;
		warningCount: number;
	};
	roblox: {
		user: UsersSingle;
		avatar: UsersAvatar["imageUrl"];
	};
};

export type component3CacheData = {
	message: Message;
	roblox: {
		user: Records["input"]["user"];
	};
};

export type component3CacheData2 = {
	message: Message;
};

export const enum ManageRecordOptions {
	"EDIT_REASON" = "EDIT_REASON",
	"EDIT_ACTION" = "EDIT_ACTION",
	"DELETE" = "DELETE",
}
