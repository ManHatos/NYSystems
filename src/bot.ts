import "dotenv/config";
import { createBot } from "@discordeno/bot";
import { GATEWAY as gateway } from "./services/gateway.js";
import { REST as rest } from "./services/rest.js";
import { events } from "./handlers/events/index.js";
import { commands } from "./handlers/commands/index.js";
import { log } from "./helpers/logger.js";

export const BOT = createBot({
	token: process.env.TOKEN as string,
	events,
	gateway,
	rest,
});

// start the gateway connection
await BOT.start();

// PUT application commands
await BOT.rest
	.upsertGuildApplicationCommands(process.env.GUILD_ID as string, commands)
	.then(() => log.info("Successfully loaded commands"))
	.catch((error) => log.error("Error loading commands\n" + (error as string)));

// process.exit();
