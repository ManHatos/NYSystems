import { PrismaClient } from "@prisma/client";
import { log } from "../helpers/logger.js";
export const prisma = new PrismaClient({
	log: [
		{
			level: "query",
			emit: "event",
		},
	],
});

prisma.$on("query", (event) => {
	log.info(`Datastore service received query event:\n${event.query}`);
});
