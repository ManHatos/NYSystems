import "dotenv/config";
import { createGatewayManager } from "@discordeno/gateway";
import { GatewayOpcodes } from "@discordeno/types";
// import { GatewayIntents } from "@discordeno/types";
import { REST } from "../rest/manager.js";

export const GATEWAY = createGatewayManager({
	token: process.env.TOKEN as string,
	events: {
		connecting(/* shard */) {
			// logger
		},
		identified(/* shard */) {
			// logger
		},
		async message(shard, payload): Promise<void> {
			if (payload.op !== GatewayOpcodes.Dispatch) return;
			// events[payload.t]?.(payload); event handlers
		},
	},
	// intents: GatewayIntents
	connection: await REST.getSessionInfo(),
});

GATEWAY.spawnShards();
