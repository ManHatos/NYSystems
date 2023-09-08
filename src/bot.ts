import "dotenv/config";

import { GATEWAY as gateway } from "./services/gateway.js";
import { REST as rest } from "./services/rest.js";

import { log } from "./helpers/logger.js";
import { modules } from "./modules/modules.js";
import { ApplicationCommandTypes, InteractionTypes, createBot } from "@discordeno/bot";

/** main bot object, handles all incoming and outgoing requests to and from Discord */
export const BOT = createBot({
	token: process.env.TOKEN as string,
	events: {
		async interactionCreate(interaction) {
			console.dir(interaction);

			// application commands handler
			if (interaction.type == InteractionTypes.ApplicationCommand) {
				if (interaction.data?.type == ApplicationCommandTypes.ChatInput) {
					modules.commands.has(interaction.data?.name)
						? modules.commands.get(interaction.data.name)!.execute(interaction)
						: log.error(`Unknown application command "/${interaction.data.name}"`);
				}
			}
		},
	},
	gateway,
	rest,
});

// setting desired properties
BOT.transformers.desiredProperties.interaction = {
	...BOT.transformers.desiredProperties.interaction,
	type: true,
	data: true,
};

// start the gateway connection
await BOT.start();

// PUT application commands
await BOT.rest
	.upsertGuildApplicationCommands(
		process.env.GUILD_ID as string,
		modules.commands.data.map((element) => element.data)
	)
	.then((response) => log.info("Successfully loaded commands\n" + response))
	.catch((error) => log.error("Error loading commands\n" + JSON.stringify(error)));

// process.exit();
