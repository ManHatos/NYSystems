import "dotenv/config";
import { createBot } from "@discordeno/bot";
import { GATEWAY } from "./services/gateway.js";
import { REST } from "./services/rest.js";
import { events } from "./handlers/events/events.js";

export const BOT = createBot({
	token: process.env.TOKEN as string,
	events,
});

BOT.gateway = GATEWAY;
BOT.rest = REST;

BOT.start();
