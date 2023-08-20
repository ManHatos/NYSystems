import "dotenv/config";
import { createGatewayManager } from "@discordeno/bot";
import { REST } from "./rest.js";
import { log } from "../helpers/logger.js";

export const GATEWAY = createGatewayManager({
	token: process.env.TOKEN as string,
	events: {
		connecting() {
			log.info("Connecting to gateway...");
		},
		identified() {
			log.info("Successfully connected to gateway");
			log.info("Listening for dispatched events");
		},
		disconnected() {
			log.warn("Disconnected from gateway");
		},
	},
	intents: 0,
	connection: await REST.getSessionInfo(),
});
