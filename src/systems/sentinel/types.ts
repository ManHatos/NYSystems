import { Message } from "@discordeno/bot";
import { Record } from "@prisma/client";
import { RecordActions, BanRequest } from "../../services/datastore.js";
import { UsersSingle, UsersAvatar } from "../../services/roblox/users.js";

// additional system typings
export type Command1CacheData = {
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

export type Component3CacheData = {
	message: Message;
	roblox: {
		user: Record["info"]["user"];
	};
};

export type Component3CacheData2 = {
	message: Message;
};

export const enum ManageRecordOptions {
	"EDIT_REASON" = "EDIT_REASON",
	"EDIT_ACTION" = "EDIT_ACTION",
	"DELETE" = "DELETE",
}
