import "dotenv/config";
import {
	ApplicationCommandTypes,
	InteractionTypes,
	createBot,
	createGatewayManager,
	createRestManager,
} from "@discordeno/bot";
import { log } from "../helpers/logger.js";
import { systems } from "../systems/systems.js";

export const REST = createRestManager({
	token: process.env.DISCORD_TOKEN,
});

export const GATEWAY = createGatewayManager({
	token: process.env.DISCORD_TOKEN,
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

/** main bot object, handles all incoming and outgoing requests to and from Discord */
export const discord = createBot({
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
					systems.commands.has(interaction.data.name)
						? systems.commands
								.get(interaction.data.name)
								?.execute(
									interaction,
									interaction.data.options?.map((option) => option.value) ?? []
								)
						: log.error(`Unknown application command "/${interaction.data?.name ?? "not found"}"`);
				}
			} else if (interaction.type == InteractionTypes.ApplicationCommandAutocomplete) {
				// autocomplete handler
				const focusedOption = interaction.data?.options?.find((option) => option.focused);
				if (!focusedOption) return;

				systems.autocomplete.has(focusedOption?.name)
					? systems.autocomplete.get(focusedOption.name)?.execute(interaction, focusedOption)
					: log.error(`Unknown autocomplete option "${focusedOption?.name ?? "not found"}"`);
			} else if (interaction.type == InteractionTypes.MessageComponent) {
				// components handler
				if (!interaction.data?.customId) return;
				systems.components.has(interaction.data.customId)
					? systems.components.get(interaction.data.customId)?.execute(interaction)
					: log.error(`Unknown message component "${interaction.data.customId}"`);
			}
		},
	},
	gateway: GATEWAY,
	rest: REST,
});
