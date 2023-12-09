import { PrismaClient } from "@prisma/client";
import { log } from "../helpers/logger.js";

export const datastore = Object.assign(
	new PrismaClient({
		datasources: {
			db: {
				url: process.env.DATABASE_URL,
			},
		},
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
	}),
	{
		async connect() {
			await datastore.$connect();
			const status = await datastore.$runCommandRaw({
				connectionStatus: 1,
			});
			console.log(status);
		},
	}
);

datastore.$on("info", (event) => {
	log.info("Datastore service online");
});

datastore.$on("error", (error) => {
	log.info("Datastore service error\n" + error.message + "\n" + error.target);
});

datastore.$on("query", (event) => {
	log.info(`Datastore service received query event:\n${event.query}`);
});

export enum RecordActions {
	"Ban" = 0,
	"Kick" = 1,
	"Warning" = 2,
}
