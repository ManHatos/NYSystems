import "dotenv/config";
import { createClient } from "redis";
import { ErrorCodes, ErrorLevels, SystemError } from "../helpers/errors.js";
import { stringify, unstringify, validateStringify } from "../helpers/utility.js";

const redis = createClient({
	url: process.env.CACHE_URL,
	password: process.env.CACHE_PASS,
});

redis.on("connect", () => console.log("redis connecting"));
redis.on("ready", () => console.log("redis service online"));

let reconnections = 0;
redis.on("reconnecting", () => {
	console.log("redis service reconnecting");
	if (++reconnections >= 5) {
		console.error("redis service failed: shutting down");
		process.exit();
	}
});
redis.on("error", (error) => console.log("redis service error: " + error));

/** contact the redis server */
export const cachestore = {
	/** use the raw redis module commands */
	core: redis,
	/** set a key with a value */
	set: async (
		key: string,
		value: any,
		options?: { expiry?: number; replace?: false }
	): Promise<void> => {
		return new Promise(async (resolve, reject) => {
			try {
				await redis
					.SET(key, typeof value == "string" ? value : stringify(value) ?? "<weird value>", {
						EX: options?.expiry,
						NX: options?.replace ? true : undefined,
					})
					.catch(handleError);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	},
	/** retrieve a value using its saved key */
	get: async (key: string, options?: { expiry?: number; delete?: true }): Promise<any> => {
		return new Promise(async (resolve, reject) => {
			try {
				const value = await (() => {
					if (options?.delete) return redis.GETDEL(key).catch(handleError);
					else if (options?.expiry)
						return redis
							.GETEX(key, {
								EX: options.expiry,
							})
							.catch(handleError);
					else return redis.GET(key).catch(handleError);
				})();

				if (typeof value == "string")
					resolve(validateStringify(value) ? unstringify(value) : value);
				else
					throw new SystemError({
						...defaultError(),
						level: ErrorLevels.System,
						cause: "Cache returned unknown value type",
					});
			} catch (error) {
				reject(error);
			}
		});
	},
	/** delete a key and its value */
	delete: async (key: string): Promise<void> => {
		return new Promise(async (resolve, reject) => {
			try {
				await redis.DEL(key).catch(handleError);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	},
};

function handleError(error: any) {
	throw new SystemError({
		...defaultError(),
		level: ErrorLevels.System,
		cause: error,
	});
}

function defaultError(): Pick<SystemError, "code" | "message"> {
	return {
		code: ErrorCodes.CACHESTORE_UNKNOWN,
		message: "The cachestore service has encountered an error.\nPlease try again later.",
	};
}
