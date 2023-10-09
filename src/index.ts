import "dotenv/config";
import { GATEWAY as gateway, REST as rest } from "./services/discord.js";
import { datastore } from "./services/datastore.js";
import { cachestore } from "./services/cachestore.js";
import { log } from "./helpers/logger.js";
import { modules } from "./modules/modules.js";
import {
	ApplicationCommandTypes,
	InteractionTypes,
	createBot,
	logger as DiscordenoLogger,
} from "@discordeno/bot";

/** main bot object, handles all incoming and outgoing requests to and from Discord */
export const BOT = createBot({
	token: process.env.DISCORD_TOKEN,
	events: {
		async interactionCreate(interaction) {
			log.info(
				InteractionTypes[interaction.type] + " interaction received by " + interaction?.user?.id
			);

			if (interaction.type == InteractionTypes.ApplicationCommand) {
				// application commands handler
				if (interaction.data?.type == ApplicationCommandTypes.ChatInput) {
					// slash commands handler
					modules.commands.has(interaction.data?.name)
						? modules.commands.get(interaction.data!.name)!.execute(interaction)
						: log.error(`Unknown application command "/${interaction.data?.name ?? "not found"}"`);
				}
			} else if (interaction.type == InteractionTypes.ApplicationCommandAutocomplete) {
				// autocomplete handler
				const focusedOption = interaction.data?.options?.find((option) => option.focused);
				if (!focusedOption) return;

				modules.autocomplete.has(focusedOption?.name)
					? modules.autocomplete.get(focusedOption.name)!.execute(interaction, focusedOption)
					: log.error(`Unknown autocomplete option "${focusedOption?.name ?? "not found"}"`);
			}
		},
	},
	gateway,
	rest,
});

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
})(BOT.transformers.desiredProperties);

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
	await BOT.rest
		.upsertGuildApplicationCommands(
			process.env.DISCORD_GUILD,
			modules.commands.data.map((element) => element.data)
		)
		.then((response) => log.info("Successfully loaded commands\n" + response))
		.catch((error) => log.error("Error loading commands\n" + JSON.stringify(error)));
})();

// initiate gateway connection
await BOT.start();

// handle fatal process events
process.on("uncaughtException", (e) => console.log("unhandled exception: ", e));
process.on("unhandledRejection", (e) => console.log("unhandled rejection: ", e));
