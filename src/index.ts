import "dotenv/config";
import { discord } from "./services/discord.js";
import { datastore } from "./services/datastore.js";
import { cachestore } from "./services/cachestore.js";
import { log } from "./helpers/logger.js";
import { systems } from "./systems/systems.js";
import { logger as DiscordenoLogger } from "@discordeno/bot";

// disable default logger
DiscordenoLogger.setLevel(100 as number);

// set desired properties
((object) => {
	function fn(object: Record<string, any>) {
		for (const [key, property] of Object.entries(object)) {
			if (typeof property === "object" && property) {
				fn(property);
				continue;
			}
			object[key] = true;
		}
	}
	fn(object);
})(discord.transformers.desiredProperties);

// initiate datastore service
(async () => {
	const L1 = performance.now();
	await datastore.$connect();
	log.info(`Datastore took ${(performance.now() - L1).toFixed(5)} ms`);
})();

// initiate cachestore service
(async () => {
	const L1 = performance.now();
	await cachestore.connect();
	log.info(`Cachestore took ${(performance.now() - L1).toFixed(5)} ms`);
})();

// load application commands
(async () => {
	// check whether loading commands was requested when starting system
	if (!process.argv.includes("loadCmd")) return;
	log.info("Loading application commands...");
	await discord.rest
		.upsertGuildApplicationCommands(
			process.env.DISCORD_GUILD,
			systems.commands.data.map((element) => element.data)
		)
		.then((response) => log.info("Successfully loaded commands\n" + response))
		.catch((error) => log.error("Error loading commands\n" + JSON.stringify(error)));
})();

// initiate gateway connection
await discord.start();

// handle fatal process events
process.on("uncaughtException", (e) => console.log("unhandled exception: ", e));
process.on("unhandledRejection", (e) => console.log("unhandled rejection: ", e));
