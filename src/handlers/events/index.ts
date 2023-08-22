import { EventHandlers } from "@discordeno/bot";

import { example } from "./example.js";

export const events: Partial<EventHandlers> = {
	...example,
};
