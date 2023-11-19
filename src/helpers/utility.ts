import "dotenv/config";
import { cachestore } from "../services/cachestore.js";

/** reduce multiple requests made within `delay` across different child processes, resolves if `value` (a string used to identify the request) was associated with the latest request, rejects if `value` was replaced */
export const throttle = async (group: string[], value: string, delay: number): Promise<void> => {
	return new Promise(async (resolve, reject) => {
		if (group.length < 2) return reject("group is too short");
		else group.push("throttle");
		const cachePath = group.join("/");

		await cachestore.setEx(cachePath, parseInt((delay / 1000).toFixed()) + 10, value);

		await (async (): Promise<void> => {
			return new Promise((resolve) => {
				setTimeout(() => resolve(), delay);
			});
		})();

		const cacheLatest = await cachestore.get(cachePath);

		if (typeof cacheLatest == "string" && cacheLatest == value) return resolve();
		else return reject("overwritten");
	});
};

/** replace all characters in a string after provided `limit` (index from 1) and optionally replaces the excess with a string (default) */
export const limitString = (string: string, limit: number, replaceWith: string = "...") => {
	return string.replace(RegExp(`(?<=.{${limit}}).+`), replaceWith);
};

/** extract the creation date from a Discord user identifiers (ID) */
export const dateFromSnowflake = (snowflake: bigint, epoch = 1420070400000n): Date => {
	return new Date(Number((snowflake >> 22n) + epoch));
};

/** turn a number of days into a date, `n > 0` = past, `n < 0` = future */
export const dateFromDays = (
	days: number,
	options?: {
		pastOnly: boolean;
	}
): Date => {
	const ms = (options?.pastOnly ? Math.abs(days) : days) * 24 * 60 * 60 * 1000;
	return new Date(Date.now() - ms);
};

/** extract the user identifier (ID) from a `MODERATION_USER` autocomplete option */
export const extractUserAutocompleteID = (value: string): number => {
	return value.startsWith(process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX) || value.startsWith("#")
		? Number(value.replace(process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX, "").replace("#", ""))
		: NaN;
};
