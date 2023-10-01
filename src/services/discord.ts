import "dotenv/config";
import { createGatewayManager, createRestManager } from "@discordeno/bot";
import { log } from "../helpers/logger.js";

export const REST = createRestManager({
	token: process.env.TOKEN as string,
});

export const GATEWAY = createGatewayManager({
	token: process.env.TOKEN as string,
	events: {
		connecting() {
			log.info("Connecting to gateway...");
		},
		connected() {
			log.info("Successfully connected to gateway");
		},
		identified() {
			log.info("Successfully identified gateway connection");
			log.info("Listening for dispatched events");
		},
		disconnected() {
			log.warn("Disconnected from gateway");
		},
		resuming(shard) {
			log.warn("Resuming gateway connection...");
		},
		resumed(shard) {
			log.info("Successfully resumed gateway connection");
		},
	},
	intents: 0,
	connection: await REST.getSessionInfo(),
});
