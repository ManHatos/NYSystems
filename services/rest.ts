import "dotenv/config";
import { createRestManager } from "@discordeno/bot";

export const REST = createRestManager({
	token: process.env.TOKEN as string,
});
