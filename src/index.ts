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
	token: process.env.TOKEN as string,
	events: {
		async interactionCreate(interaction) {
			// application commands handler
			if (interaction.type == InteractionTypes.ApplicationCommand) {
				if (interaction.data?.type == ApplicationCommandTypes.ChatInput) {
					modules.commands.has(interaction.data?.name)
						? modules.commands.get(interaction.data!.name)!.execute(interaction)
						: log.error(`Unknown application command "/${interaction.data?.name ?? "unknown"}"`);
				}
			} else if (interaction.type == InteractionTypes.ApplicationCommandAutocomplete) {
				const focusedOption = interaction.data?.options?.find((option) => option.focused);
				console.log("ac data:", interaction.data);
				modules.autocomplete.has(focusedOption?.name)
					? modules.autocomplete.get(focusedOption!.name)!.execute(interaction)
					: log.error(`Unknown autocomplete option "${focusedOption?.name ?? "unknown"}"`);
			}
		},
	},
	gateway,
	rest,
});

// disable default logger
DiscordenoLogger.setLevel(100 as number);

// set desired interaction properties
for (const key in BOT.transformers.desiredProperties.interaction) {
	BOT.transformers.desiredProperties.interaction[
		key as keyof typeof BOT.transformers.desiredProperties.interaction
	] = true;
}

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
	log.info("Loading application commands...");
	await BOT.rest
		.upsertGuildApplicationCommands(
			process.env.GUILD_ID as string,
			modules.commands.data.map((element) => element.data)
		)
		.then((response) => log.info("Successfully loaded commands\n" + response))
		.catch((error) => log.error("Error loading commands\n" + JSON.stringify(error)));
})();

// initiate gateway connection
await BOT.start();

process.on("uncaughtException", (e) => console.log("unhandled exception", e));
process.on("unhandledRejection", (e) => console.log("unhandled rejection", e));
