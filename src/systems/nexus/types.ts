import { NexusRegistrars } from "../../services/datastore.js";
import { UsersSingle } from "../../services/roblox/users.js";

export const NexusRegistrarLabels: { [K in keyof typeof NexusRegistrars]: K } = {
	Bloxlink: "Bloxlink",
	Nexus: "Nexus",
};

export const enum NexusNameOptions {
	"RobloxName" = "RobloxName",
	"RobloxDisplay" = "RobloxDisplay",
	"Custom" = "Custom",
}

export type Component2CacheData = {
	roblox: {
		user: UsersSingle;
	};
	registrar: NexusRegistrars;
};
