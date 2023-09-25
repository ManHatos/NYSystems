import { PrismaClient } from "@prisma/client";
import { log } from "../helpers/logger.js";

export const datastore = new PrismaClient({
	log: [
		{
			level: "info",
			emit: "event",
		},
		{
			level: "query",
			emit: "event",
		},
		{
			level: "error",
			emit: "event",
		},
	],
});

datastore.$on("info", (event) => {
	log.info("Datastore service online");
});

datastore.$on("error", (error) => {
	log.info("Datastore service error\n" + error.message + "\n" + error.target);
});

datastore.$on("query", (event) => {
	log.info(`Datastore service received query event:\n${event.query}`);
});
