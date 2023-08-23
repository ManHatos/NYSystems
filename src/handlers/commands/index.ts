import { CreateApplicationCommand } from "@discordeno/bot";

import * as moderation from "./moderation.js";

export const commands: Array<CreateApplicationCommand> = [moderation].flatMap((command) =>
	Object.values(command)
);
